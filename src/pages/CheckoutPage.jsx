import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ordersAPI, usersAPI, adminAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import RazorpayPayment from "../components/payment/RazorpayPayment";
import { toast } from "react-hot-toast";
import "./CheckoutPage.css";
// Add these imports after line 14:
import { useDistancePricing } from "../hooks/useDistancePricing";
import distancePricingService from "../services/distancePricingService";
import OrderPlacementOverlay from "../components/common/OrderPlacementOverlay";
import CashfreePayment from "../components/payment/CashfreePayment";
import GSTBreakdown from "../components/cart/GSTBreakdown";
const CheckoutPage = () => {
  const { user } = useAuth();
  const {
    items,
    total,
    appliedCoupon,
    appliedCoins,
    finalAmount,
    clearCart,
    refreshCart,
  } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPaymentGateway, setSelectedPaymentGateway] =
    useState("razorpay");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedSubMethod, setSelectedSubMethod] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingData, setShippingData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState("45-60 mins");
  const [showOrderAnimation, setShowOrderAnimation] = useState(false);
  const [orderAnimationData, setOrderAnimationData] = useState(null);
  // Add these state variables after line 48 where you have other useState declarations:
  const [deliveryCost, setDeliveryCost] = useState(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryCalculationError, setDeliveryCalculationError] =
    useState(null);

  // Add this hook after your other hooks:
  const { getCurrentLocation, calculateCartDelivery } = useDistancePricing();
  // Address management state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gstBreakdownData, setGstBreakdownData] = useState(null);
  // ADD this line after your existing state declarations (around line 48):
  const [customerDeliveryState, setCustomerDeliveryState] = useState("");
  // Form setup
  const [selectedAdvancePercentage, setSelectedAdvancePercentage] =
    useState(25);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      addressType: "home",
    },
  });

  // Fetch saved addresses
  const { data: addressesResponse, isLoading: addressesLoading } = useQuery(
    "userAddresses",
    usersAPI.getAddresses,
    {
      enabled: !!user,
      onSuccess: (data) => {
        const addresses = data?.data?.addresses || [];
        console.log("✅ Fetched saved addresses:", addresses.length);

        // Auto-select default address if available
        const defaultAddress = addresses.find((addr) => addr.isDefault);
        if (defaultAddress && !selectedAddressId && !shippingData) {
          setSelectedAddressId(defaultAddress._id);
          setShippingData({
            fullName: user?.name || "",
            phone: user?.phoneNumber || "",
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.pincode,
            addressType: defaultAddress.type || "home",
            addressId: defaultAddress._id,
          });
          console.log("✅ Auto-selected default address");
        }
      },
      onError: (error) => {
        console.error("❌ Failed to fetch addresses:", error);
      },
    }
  );

  const savedAddresses = addressesResponse?.data?.addresses || [];
  // Add this useEffect after your existing useEffects around line 100:
  useEffect(() => {
    // ...existing code...

    // Replace the calculateDeliveryForSelectedAddress function (around line 120):
    const calculateDeliveryForSelectedAddress = async () => {
      if (!selectedAddressId || !savedAddresses.length) {
        console.log("⚠️ No address selected for delivery calculation");
        return;
      }

      const selectedAddress = savedAddresses.find(
        (addr) => addr._id === selectedAddressId
      );
      if (!selectedAddress) {
        console.log("⚠️ Selected address not found");
        return;
      }

      // FIXED: Check for coordinates - correct structure from backend
      const hasCoords =
        selectedAddress.coordinates &&
        typeof selectedAddress.coordinates.latitude === "number" &&
        typeof selectedAddress.coordinates.longitude === "number" &&
        selectedAddress.coordinates.latitude !== 0 &&
        selectedAddress.coordinates.longitude !== 0;

      if (!hasCoords) {
        console.log(
          "⚠️ Address has no valid coordinates, skipping calculation"
        );
        console.log("Address coordinates:", selectedAddress.coordinates);
        return;
      }

      console.log(
        "✅ Valid address with coordinates found:",
        selectedAddress.coordinates
      );

      try {
        // Group cart items by supplier
        const supplierGroups = {};
        items.forEach((item) => {
          const supplierId =
            item.product?.supplier?._id || item.product?.supplier;
          if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = {
              supplier: item.product.supplier,
              items: [],
              totalWeight: 0,
            };
          }
          supplierGroups[supplierId].items.push(item);
          supplierGroups[supplierId].totalWeight +=
            item.quantity * (item.product.weight || 1);
        });

        let totalTransportCost = 0;
        const supplierDeliveryDetails = [];

        // Calculate delivery cost for each supplier
        for (const [supplierId, supplierData] of Object.entries(
          supplierGroups
        )) {
          const supplier = supplierData.supplier;

          // Check if supplier has location and transport rates
          if (
            !supplier.dispatchLocation?.coordinates ||
            !supplier.transportRates
          ) {
            console.log(
              `⚠️ Supplier ${supplier.companyName || supplierId} missing location or transport rates`
            );
            continue;
          }

          // Get supplier coordinates (GeoJSON format: [longitude, latitude])
          const supplierLng = supplier.dispatchLocation.coordinates[0];
          const supplierLat = supplier.dispatchLocation.coordinates[1];

          // Get customer coordinates
          const customerLat = selectedAddress.coordinates.latitude;
          const customerLng = selectedAddress.coordinates.longitude;

          // Calculate distance using Haversine formula
          const distance = calculateHaversineDistance(
            customerLat,
            customerLng,
            supplierLat,
            supplierLng
          );

          // Calculate delivery cost based on distance and transport rates
          const deliveryCost = calculateDeliveryDetails(
            distance,
            supplier.transportRates,
            supplierData.totalWeight
          );

          totalTransportCost += deliveryCost.cost;
          supplierDeliveryDetails.push({
            supplierId,
            supplierName: supplier.companyName,
            distance,
            cost: deliveryCost.cost,
            deliveryTime: deliveryCost.deliveryTime,
            zone: deliveryCost.zone,
          });

          console.log(
            `🚚 ${supplier.companyName}: ${distance.toFixed(2)}km, ₹${deliveryCost.cost}`
          );
        }

        // Set the calculated delivery cost
        setDeliveryCost({
          totalTransportCost,
          supplierDetails: supplierDeliveryDetails,
          calculatedAt: new Date().toISOString(),
        });

        console.log("✅ Total delivery cost calculated:", totalTransportCost);
      } catch (error) {
        console.error("❌ Error calculating delivery cost:", error);
      }
    };

    // Add these helper functions after calculateDeliveryForSelectedAddress:

    // Haversine distance calculation
    const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Calculate delivery details based on distance and transport rates
    const calculateDeliveryDetails = (
      distance,
      transportRates,
      totalWeight = 1
    ) => {
      let zone, rates;

      if (distance <= 5) {
        zone = "upTo5km";
        rates = transportRates.upTo5km;
      } else if (distance <= 10) {
        zone = "upTo10km";
        rates = transportRates.upTo10km;
      } else if (distance <= 20) {
        zone = "upTo20km";
        rates = transportRates.upTo20km;
      } else {
        zone = "above20km";
        rates = transportRates.above20km;
      }

      // Calculate cost: base cost + (distance * cost per km) + weight factor
      const baseCost = rates?.baseCost || 0;
      const costPerKm = rates?.costPerKm || 0;
      const weightFactor = Math.max(1, Math.ceil(totalWeight / 10)); // Every 10kg adds to cost

      const cost = Math.round(baseCost + distance * costPerKm);
      const deliveryTime = rates?.estimatedDeliveryTime || "Contact supplier";

      return {
        cost,
        deliveryTime,
        zone,
        distance: distance.toFixed(2),
      };
    };

    calculateDeliveryForSelectedAddress();
  }, [selectedAddressId, items, addressesResponse]);
  // Redirect if cart is empty
  useEffect(() => {
    if (!items || items.length === 0) {
      navigate("/cart");
      toast.error("Your cart is empty");
    }
  }, [items, navigate]);

  // Redirect if not customer
  useEffect(() => {
    if (user && user.role !== "customer") {
      navigate("/");
      toast.error("Only customers can place orders");
    }
  }, [user, navigate]);
  // Add these useEffect hooks after the existing ones:

  // Debug state changes
  useEffect(() => {
    console.log("🎬 showOrderAnimation changed:", showOrderAnimation);
    if (showOrderAnimation) {
      console.log("🎬 Animation data:", orderAnimationData);
    }
  }, [showOrderAnimation]);

  useEffect(() => {
    console.log("🔒 showPaymentGateway changed:", showPaymentGateway);
    if (showPaymentGateway) {
      console.log("🔒 Selected gateway:", selectedPaymentGateway);
      console.log("🔒 Order created:", !!orderCreated);
    }
  }, [showPaymentGateway]);

  useEffect(() => {
    console.log("💳 paymentData changed:", paymentData);
  }, [paymentData]);
  // Location detection function
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Use a simple reverse geocoding or just store coordinates
        setDetectedLocation({
          coordinates: { latitude, longitude },
          city: "Detected City", // You can implement reverse geocoding here
          state: "Detected State",
          address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        });

        // Auto-fill detected values
        setValue("city", "Detected City");
        setValue("state", "Detected State");

        setIsDetectingLocation(false);
        toast.success("Location detected successfully!");
      },
      (error) => {
        setIsDetectingLocation(false);
        let message = "Failed to detect location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += "Location access was denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            message += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message += "Location request timed out.";
            break;
          default:
            message += "An unknown error occurred.";
            break;
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle saved address selection
  const handleAddressSelect = (address) => {
    setSelectedAddressId(address._id);
    // ADD THIS LINE:
    if (address?.state) {
      setCustomerDeliveryState(address.state);
    }
    // ... rest of existing code
    setShippingData({
      fullName: user?.name || "",
      phone: user?.phoneNumber || "",
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.type || "home",
      addressId: address._id,
    });
    setCustomerDeliveryState(address.state);
    setShowNewAddressForm(false);
    setCurrentStep(2);
    console.log("✅ Selected saved address:", address.address);
  };

  // Handle new address toggle
  const handleNewAddressToggle = () => {
    setSelectedAddressId(null);
    setShippingData(null);
    setShowNewAddressForm(true);

    // Reset form to defaults
    reset({
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      addressType: "home",
    });

    // Apply detected location if available
    if (detectedLocation) {
      if (detectedLocation.city) setValue("city", detectedLocation.city);
      if (detectedLocation.state) setValue("state", detectedLocation.state);
      if (detectedLocation.address)
        setValue("address", detectedLocation.address);
    }
  };

  // ADD ADDRESS MUTATION
  const addAddressMutation = useMutation(
    (addressData) => usersAPI.addAddress(addressData),
    {
      onSuccess: (response) => {
        console.log("✅ Address added successfully:", response);
      },
      onError: (error) => {
        console.error("❌ Failed to add address:", error);
        const errorMessage =
          error?.response?.data?.message || "Failed to save address";
        toast.error(errorMessage);
        setIsProcessing(false);
        setOrderError(errorMessage);
      },
    }
  );
  const handlePaymentSuccess = (paymentDetails) => {
    try {
      console.log("✅ Payment successful, now showing success animation");

      // Close payment gateway
      setShowPaymentGateway(false);

      // NOW show the success animation (only after payment)
      setOrderAnimationData({
        orderNumber:
          orderCreated.orderId || orderCreated._id?.slice(-8).toUpperCase(),
        totalAmount: paymentDetails.amount || orderCreated.pricing?.totalAmount,
        estimatedDelivery:
          orderCreated.delivery?.estimatedTime || "2-3 business days",
        paymentId: paymentDetails.transactionId,
      });
      setShowOrderAnimation(true);

      toast.success("Payment completed successfully!");
    } catch (error) {
      console.error("Error in payment success handler:", error);
      toast.error(
        "Payment successful but there was an issue. Please contact support."
      );
    }
  };

  // PAYMENT ERROR HANDLER - Add this before checkoutMutation
  const handlePaymentError = (error) => {
    console.error("❌ Payment failed:", error);
    setShowPaymentGateway(false);

    // Navigate to payment failed page with order details
    const orderIdentifier = orderCreated?.orderId || orderCreated?._id;
    if (orderIdentifier) {
      navigate(`/payment/failed/${orderIdentifier}`, {
        state: { error: error.message || "Payment failed" },
      });
    } else {
      toast.error("Payment failed. Please try again.");
      // Reset to allow retry
      setOrderCreated(null);
      setIsProcessing(false);
    }
  };

  // CLOSE ANIMATION HANDLER - Add this before checkoutMutation

  // CREATE ORDER MUTATION
  const checkoutMutation = useMutation(
    (orderData) => ordersAPI.checkout(orderData),
    {
      onSuccess: (response) => {
        console.log("✅ Order created successfully:", response);

        const orderData =
          response?.data?.order || response?.order || response?.data;
        console.log("🔍 Extracted orderData:", orderData);

        if (!orderData) {
          console.error("❌ Invalid order response structure:", response);
          throw new Error("Invalid order response structure");
        }

        setOrderCreated(orderData);
        const orderIdentifier = orderData.orderId || orderData._id;
        console.log("🔍 Order identifier:", orderIdentifier);

        if (!orderIdentifier) {
          console.error("❌ No order identifier found in response:", orderData);
          throw new Error("Order identifier not found in response");
        }

        console.log("🔍 Payment method:", paymentData?.method);
        console.log(
          "🔍 Full paymentData:",
          JSON.stringify(paymentData, null, 2)
        );

        // CRITICAL FIX: Different flow for COD vs Online payments
        if (paymentData?.method === "cod") {
          console.log("💰 COD order - showing success animation");

          // COD: Show success animation then navigate to confirmation
          setOrderAnimationData({
            orderNumber:
              orderData.orderId || orderData._id?.slice(-8).toUpperCase(),
            totalAmount:
              orderData.pricing?.totalAmount || orderData.totalAmount,
            estimatedDelivery:
              orderData.delivery?.estimatedTime || "2-3 business days",
          });
          setShowOrderAnimation(true);
        } else {
          console.log(
            "🔒 Online payment detected - method:",
            paymentData?.method
          );
          console.log("🔒 Online payment - opening gateway IMMEDIATELY");

          // ONLINE PAYMENTS: Open payment gateway immediately with proper z-index
          if (
            paymentData?.gateway === "cashfree" ||
            paymentData?.method === "cashfree"
          ) {
            console.log("🔒 Opening Cashfree gateway");
            setSelectedPaymentGateway("cashfree");
          } else {
            console.log("🔒 Opening Razorpay gateway (default)");
            setSelectedPaymentGateway("razorpay");
          }

          // CRITICAL: Use setTimeout to ensure proper rendering order
          setTimeout(() => {
            console.log("🔒 Setting showPaymentGateway to true with delay");
            setShowPaymentGateway(true);
          }, 100); // Small delay to ensure DOM is ready
        }

        setIsProcessing(false);
      },
      onError: (error) => {
        console.error("❌ Checkout error:", error);

        const errorResponse = error?.response?.data;
        let errorMessage = "Failed to place order";

        if (errorResponse?.message) {
          errorMessage = errorResponse.message;
        } else if (
          errorResponse?.errors &&
          Array.isArray(errorResponse.errors)
        ) {
          errorMessage = errorResponse.errors
            .map((err) => err.msg || err.message)
            .join(", ");
        }

        toast.error(errorMessage);
        setOrderError(errorMessage);
        setIsProcessing(false);
      },
    }
  );
  // PAYMENT SUCCESS HANDLER
  // Replace the handlePaymentSuccess function (around line 330):

  // Calculate totals - FIXED VERSION
  const calculateTotals = () => {
    const originalSubtotal = total || 0;

    console.log("🔍 DETAILED DEBUG - Cart discount data:", {
      total,
      finalAmount,
      "appliedCoupon content": JSON.stringify(appliedCoupon),
      "appliedCoins content": JSON.stringify(appliedCoins),
    });

    // Extract coupon discount
    let couponDiscount = 0;
    if (
      appliedCoupon &&
      typeof appliedCoupon.discountAmount === "number" &&
      appliedCoupon.discountAmount > 0
    ) {
      couponDiscount = appliedCoupon.discountAmount;
    }

    // Extract coin discount - this is where the issue was!
    let coinDiscount = 0;
    if (
      appliedCoins &&
      typeof appliedCoins.discount === "number" &&
      appliedCoins.discount > 0
    ) {
      coinDiscount = appliedCoins.discount;
    }

    const totalDiscount = couponDiscount + coinDiscount;

    // Calculate subtotal with discounts applied
    let subtotal;
    if (totalDiscount > 0) {
      subtotal = Math.max(0, originalSubtotal - totalDiscount);
    } else {
      subtotal = originalSubtotal;
    }

    // REPLACE LINES 438-448 WITH:

    // Dynamic delivery calculation
    let deliveryFee = 0;
    if (isCalculatingDelivery) {
      deliveryFee = 0; // Show 0 while calculating
    } else if (deliveryCost?.totalTransportCost !== undefined) {
      deliveryFee = deliveryCost.totalTransportCost; // Use calculated cost
    } else if (subtotal > 10000) {
      deliveryFee = 0; // Free delivery for orders above ₹10,000
    } else {
      deliveryFee = 500; // Fallback
    }
    const commission = Math.round(subtotal * 0.05);
    const packagingCharges = 25;
    const gst =
      gstBreakdownData?.totalGSTAmount ||
      Math.round((subtotal + commission) * 0.18);
    const finalTotal =
      subtotal + deliveryFee + commission + packagingCharges + gst;

    console.log("🔍 FINAL CALCULATION:", {
      originalSubtotal,
      subtotal,
      couponDiscount,
      coinDiscount,
      totalDiscount,
      finalTotal,
      "Coins data": appliedCoins,
    });

    return {
      commission, // Add this line
      originalSubtotal,
      subtotal,
      deliveryFee,
      packagingCharges,
      gst,
      finalTotal,
      couponDiscount,
      coinDiscount,
      totalDiscount,
    };
  };

  // Safe calculation with error handling
  let calculatedValues;
  try {
    calculatedValues = calculateTotals();
  } catch (error) {
    console.error("Error calculating totals:", error);
    // Fallback values
    calculatedValues = {
      originalSubtotal: total || 0,
      subtotal: total || 0,
      deliveryFee: total > 10000 ? 0 : 500,
      packagingCharges: 25,
      gst: gstBreakdownData?.totalGSTAmount || Math.round((total || 0) * 0.18),
      finalTotal: (total || 0) + 525 + Math.round((total || 0) * 0.18),
      couponDiscount: 0,
      coinDiscount: 0,
      totalDiscount: 0,
      commission: Math.round((total || 0) * 0.05), // Add this line
    };
  }
  // Add this calculation after the existing calculateTotals (around line 430):
  const {
    commission, // Add this line
    originalSubtotal,
    subtotal,
    deliveryFee,
    packagingCharges,
    gst,
    finalTotal,
    couponDiscount,
    coinDiscount,
    totalDiscount,
  } = calculatedValues;

  // Calculate advance and remaining amounts based on payment method
  // Replace the calculatePaymentAmounts function around line 510:

  // Calculate advance and remaining amounts based on payment method and dynamic config
  const [paymentAmounts, setPaymentAmounts] = useState({
    advancePercentage: 100,
    advanceAmount: finalTotal,
    remainingAmount: 0,
    isAdvancePayment: false,
    percentageOptions: [], // Add this for storing available options
  });

  const calculatePaymentAmounts = async () => {
    console.log(
      "🧮 Calculating payment amounts for method:",
      paymentData?.method
    );

    if (paymentData?.method === "cod") {
      return {
        advancePercentage: 100,
        advanceAmount: finalTotal,
        remainingAmount: 0,
        isAdvancePayment: false,
        percentageOptions: [],
      };
    }

    // Default fallback percentage
    let advancePercentage = 25;
    let percentageOptions = [];

    try {
      // Get primary category from cart items
      if (items && items.length > 0) {
        const primaryCategory = items[0]?.product?.category || "aggregate";
        console.log(
          "🎯 Fetching advance config for category:",
          primaryCategory
        );

        // Fetch dynamic advance payment configuration
        const response =
          await adminAPI.getAdvancePaymentOptionsForCategory(primaryCategory);
        console.log("📊 Advance payment config response:", response);

        if (response.success && response.data) {
          advancePercentage = response.data.defaultPercentage || 25;
          percentageOptions = response.data.percentageOptions || [];
          console.log(
            `✅ Using dynamic advance percentage: ${advancePercentage}% for category: ${primaryCategory}`
          );
          console.log(`📋 Available options:`, percentageOptions);
        } else {
          console.warn("⚠️ Invalid response structure:", response);
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch advance payment config, using default 25%:",
        error
      );
      // Continue with default percentage
    }

    const advanceAmount = Math.round((finalTotal * advancePercentage) / 100);
    const remainingAmount = finalTotal - advanceAmount;

    return {
      advancePercentage,
      advanceAmount,
      remainingAmount,
      isAdvancePayment: advancePercentage < 100,
      percentageOptions, // Include options for UI
    };
  };

  // Update useEffect to recalculate when payment method or items change
  useEffect(() => {
    if (paymentData) {
      calculatePaymentAmounts().then(setPaymentAmounts);
    }
  }, [paymentData, finalTotal, items]);
  // Get payment amounts

  // Add useEffect to calculate payment amounts when dependencies change

  // Replace handlePlaceOrder method (around line 433):

  const handlePlaceOrder = async () => {
    if (!shippingData || !paymentData) {
      toast.error("Please complete all steps");
      return;
    }

    setIsProcessing(true);
    setOrderError(null);

    try {
      let addressId = shippingData.addressId;

      // If using existing address, no need to create new one
      if (!addressId) {
        // Create new address
        const addressData = {
          address: shippingData.address,
          city: shippingData.city,
          state: shippingData.state,
          pincode: shippingData.pincode,
          type: shippingData.addressType || "home",
          isDefault: false,
          ...(detectedLocation?.coordinates && {
            coordinates: detectedLocation.coordinates,
          }),
        };

        const addressResponse =
          await addAddressMutation.mutateAsync(addressData);
        addressId =
          addressResponse?.data?.address?._id ||
          addressResponse?.address?._id ||
          addressResponse?.data?._id;

        if (!addressId) {
          throw new Error("Failed to get address ID from response");
        }
      }

      // Create order data with proper payment method mapping
      const orderData = {
        deliveryAddressId: addressId,
        paymentMethod: paymentData.method,
        advancePercentage: paymentAmounts.advancePercentage,
        notes: shippingData.deliveryInstructions || "",
      };

      console.log("🛍️ Creating order with payment method:", paymentData);

      await checkoutMutation.mutateAsync(orderData);
    } catch (error) {
      console.error("❌ Error in handlePlaceOrder:", error);
      let errorMessage = "Failed to process order. Please try again.";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setOrderError(errorMessage);
      setIsProcessing(false);
    }
  };
  // Replace the handleCloseOrderAnimation function around line 507:

  // Replace handleCloseOrderAnimation (around line 530):

  // Replace the handleCloseOrderAnimation function:

  const handleCloseOrderAnimation = () => {
    console.log("🎬 Closing order animation");
    setShowOrderAnimation(false);

    if (orderCreated) {
      const orderIdentifier = orderCreated.orderId || orderCreated._id;
      console.log("🎬 Order identifier for navigation:", orderIdentifier);
      console.log("🎬 Payment method:", paymentData?.method);

      if (paymentData?.method === "cod") {
        // COD: Navigate to confirmation after animation
        console.log("💰 COD - navigating to confirmation page");
        clearCart();
        navigate(`/order-confirmation/${orderIdentifier}`);
      } else {
        // Online payment: This shouldn't happen as animation shouldn't show for online payments
        console.log(
          "🔒 WARNING: Animation closed for online payment - this shouldn't happen"
        );
        console.log("🔒 Redirecting to order page");
        navigate(`/orders/${orderIdentifier}`);
      }
    }
  };
  // Force refresh cart data when component mounts
  useEffect(() => {
    const refreshCartData = async () => {
      try {
        // Force invalidate cart cache to get fresh data
        queryClient.invalidateQueries("cart");

        // Also call refreshCart if available
        if (typeof refreshCart === "function") {
          await refreshCart();
        }
      } catch (error) {
        console.error("Error refreshing cart data:", error);
      }
    };

    // Refresh when component mounts
    refreshCartData();
  }, []); // Empty dependency array means this runs once when component mounts

  // Also refresh when we detect changes in discount data
  useEffect(() => {
    console.log("🔄 Discount data changed, refreshing calculations");
  }, [appliedCoupon, appliedCoins, finalAmount]);

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="login-required">
            <div className="login-icon">🔐</div>
            <h2>Login Required</h2>
            <p>Please login to continue with your order</p>
            <button
              onClick={() => navigate("/auth/login")}
              className="login-btn"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user.phoneVerified) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="verification-required">
            <div className="verify-icon">📱</div>
            <h2>Phone Verification Required</h2>
            <p>Please verify your phone number to place orders</p>
            <button
              onClick={() =>
                navigate("/auth/verify-phone", {
                  state: { phoneNumber: user?.phoneNumber },
                })
              }
              className="verify-btn"
            >
              Verify Phone Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header */}
        <div className="checkout-header">
          <button onClick={() => navigate("/cart")} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <div className="header-content">
            <h1>Checkout</h1>
            <p>
              {items?.length || 0} items • ₹{subtotal?.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="checkout-content">
          {/* Location Detection Section */}
          <div className="checkout-section">
            <div className="section-header">
              <div className="section-icon">🎯</div>
              <div className="section-info">
                <h3>Detect Your Location</h3>
                <p>Auto-fill your address details</p>
              </div>
            </div>

            <div className="location-detection">
              <button
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="detect-location-btn"
              >
                {isDetectingLocation ? (
                  <>
                    <LoadingSpinner />
                    Detecting...
                  </>
                ) : (
                  <>📍 Detect My Location</>
                )}
              </button>

              {detectedLocation && (
                <div className="detected-location">
                  <p>
                    📍 Location detected: {detectedLocation.city},{" "}
                    {detectedLocation.state}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="checkout-section">
            <div className="section-header">
              <div className="section-icon">📍</div>
              <div className="section-info">
                <h3>Delivery Address</h3>
                <p>Where should we deliver your order?</p>
              </div>
              {shippingData && (
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setShippingData(null);
                    setSelectedAddressId(null);
                  }}
                  className="edit-btn"
                >
                  Edit
                </button>
              )}
            </div>

            {!shippingData ? (
              <div className="address-selection">
                {/* Loading State */}
                {addressesLoading && (
                  <div className="loading-addresses">
                    <LoadingSpinner />
                    <p>Loading your saved addresses...</p>
                  </div>
                )}

                {/* Saved Addresses */}
                {!addressesLoading && savedAddresses.length > 0 && (
                  <div className="saved-addresses-section">
                    <h4>Choose from saved addresses</h4>
                    <div className="saved-addresses-list">
                      {savedAddresses.map((address) => (
                        <div
                          key={address._id}
                          className={`saved-address-card ${selectedAddressId === address._id ? "selected" : ""}`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="address-header">
                            <div className="address-type">
                              <span className="address-type-icon">
                                {address.type === "home"
                                  ? "🏠"
                                  : address.type === "office"
                                    ? "🏢"
                                    : "📍"}
                              </span>
                              <span className="address-type-text">
                                {address.type.charAt(0).toUpperCase() +
                                  address.type.slice(1)}
                              </span>
                              {address.isDefault && (
                                <span className="default-badge">Default</span>
                              )}
                            </div>
                            <div className="select-radio">
                              <input
                                type="radio"
                                checked={selectedAddressId === address._id}
                                onChange={() => handleAddressSelect(address)}
                              />
                            </div>
                          </div>
                          <div className="address-details">
                            <p className="address-text">{address.address}</p>
                            <p className="address-location">
                              {address.city}, {address.state} -{" "}
                              {address.pincode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="add-new-address">
                      <button
                        type="button"
                        onClick={handleNewAddressToggle}
                        className="add-new-btn"
                      >
                        ➕ Add New Address
                      </button>
                    </div>
                  </div>
                )}
                {selectedAddressId && customerDeliveryState && (
                  <GSTBreakdown
                    customerState={customerDeliveryState}
                    items={items}
                    onGSTUpdate={(gstData) => setGstBreakdownData(gstData)}
                  />
                )}

                {/* New Address Form */}
                {!addressesLoading &&
                  (savedAddresses.length === 0 || showNewAddressForm) && (
                    <div className="new-address-form">
                      <div className="form-header">
                        <h4>
                          {savedAddresses.length === 0
                            ? "Add Delivery Address"
                            : "Add New Address"}
                        </h4>
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowNewAddressForm(false)}
                            className="cancel-new-btn"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <form
                        onSubmit={handleSubmit((data) => {
                          // Include detected location coordinates if available
                          const finalData = {
                            ...data,
                            ...(detectedLocation?.coordinates && {
                              coordinates: detectedLocation.coordinates,
                            }),
                          };

                          setShippingData(finalData);
                          setCustomerDeliveryState(data.state);
                          setCurrentStep(2);
                        })}
                      >
                        <div className="form-row">
                          <div className="form-group">
                            <input
                              {...register("fullName", {
                                required: "Full name is required",
                              })}
                              placeholder="Full Name"
                              className={errors.fullName ? "error" : ""}
                            />
                            {errors.fullName && (
                              <span className="error-msg">
                                {errors.fullName.message}
                              </span>
                            )}
                          </div>
                          <div className="form-group">
                            <input
                              {...register("phone", {
                                required: "Phone number is required",
                                pattern: {
                                  value: /^[6-9]\d{9}$/,
                                  message: "Please enter a valid phone number",
                                },
                              })}
                              placeholder="Phone Number"
                              className={errors.phone ? "error" : ""}
                            />
                            {errors.phone && (
                              <span className="error-msg">
                                {errors.phone.message}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <textarea
                            {...register("address", {
                              required: "Address is required",
                            })}
                            placeholder="Complete Address (House/Flat/Building Name, Area, Locality)"
                            rows="3"
                            className={errors.address ? "error" : ""}
                          />
                          {errors.address && (
                            <span className="error-msg">
                              {errors.address.message}
                            </span>
                          )}
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <input
                              {...register("city", {
                                required: "City is required",
                              })}
                              placeholder="City"
                              className={errors.city ? "error" : ""}
                            />
                            {errors.city && (
                              <span className="error-msg">
                                {errors.city.message}
                              </span>
                            )}
                          </div>
                          <div className="form-group">
                            <input
                              {...register("state", {
                                required: "State is required",
                              })}
                              placeholder="State"
                              className={errors.state ? "error" : ""}
                            />
                            {errors.state && (
                              <span className="error-msg">
                                {errors.state.message}
                              </span>
                            )}
                          </div>
                          <div className="form-group">
                            <input
                              {...register("pincode", {
                                required: "Pincode is required",
                                pattern: {
                                  value: /^[1-9][0-9]{5}$/,
                                  message: "Please enter a valid pincode",
                                },
                              })}
                              placeholder="Pincode"
                              className={errors.pincode ? "error" : ""}
                            />
                            {errors.pincode && (
                              <span className="error-msg">
                                {errors.pincode.message}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <input
                            {...register("landmark")}
                            placeholder="Nearby Landmark (Optional)"
                          />
                        </div>

                        <div className="address-type-selector">
                          <p>Save address as:</p>
                          <div className="address-types">
                            <label className="address-type">
                              <input
                                type="radio"
                                value="home"
                                {...register("addressType")}
                                defaultChecked
                              />
                              <span>🏠 Home</span>
                            </label>
                            <label className="address-type">
                              <input
                                type="radio"
                                value="office"
                                {...register("addressType")}
                              />
                              <span>🏢 Office</span>
                            </label>
                            <label className="address-type">
                              <input
                                type="radio"
                                value="other"
                                {...register("addressType")}
                              />
                              <span>📍 Other</span>
                            </label>
                          </div>
                        </div>

                        {/* Show detected location info */}
                        {detectedLocation && (
                          <div className="detected-location-info">
                            <p className="location-detected">
                              📍 Location detected: {detectedLocation.city},{" "}
                              {detectedLocation.state}
                            </p>
                          </div>
                        )}

                        <button type="submit" className="continue-btn">
                          Continue to Payment
                        </button>
                      </form>
                    </div>
                  )}
              </div>
            ) : (
              <div className="selected-address">
                <div className="address-card">
                  <div className="address-type-badge">
                    {shippingData.addressType}
                  </div>
                  <h4>{shippingData.fullName}</h4>
                  <p>{shippingData.address}</p>
                  <p>
                    {shippingData.city}, {shippingData.state} -{" "}
                    {shippingData.pincode}
                  </p>
                  <p className="phone">📞 {shippingData.phone}</p>
                  {shippingData.addressId && (
                    <p className="address-note">✅ Using saved address</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          {currentStep >= 2 && (
            <div className="checkout-section">
              <div className="section-header">
                <div className="section-icon">💳</div>
                <div className="section-info">
                  <h3>Payment Method</h3>
                  <p>Choose your preferred payment option</p>
                </div>
                {paymentData && (
                  <button
                    onClick={() => {
                      setCurrentStep(2);
                      setPaymentData(null);
                    }}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Payment Method Selection */}
              {!paymentData ? (
                <div className="payment-options">
                  <h4>Choose Payment Method</h4>

                  {/* Cash on Delivery */}
                  <div
                    className="payment-option"
                    onClick={() => {
                      setPaymentData({ method: "cod" });
                      setCurrentStep(3);
                    }}
                  >
                    <div className="payment-icon">💰</div>
                    <div className="payment-info">
                      <h4>Cash on Delivery</h4>
                      <p>Pay when your order arrives</p>
                    </div>
                    <div className="payment-radio">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                  </div>

                  {/* Online Payment Options */}
                  <div
                    className="payment-option"
                    onClick={() => {
                      setShowPaymentMethods(true);
                    }}
                  >
                    <div className="payment-icon">🔒</div>
                    <div className="payment-info">
                      <h4>Pay Online</h4>
                      <p>Cards, UPI, Net Banking - Secure & Fast</p>
                    </div>
                    <div className="payment-radio">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                // Show selected payment method
                <div className="selected-payment">
                  <div className="payment-card">
                    <div className="payment-icon">
                      {paymentData.method === "cod" ? "💰" : "🔒"}
                    </div>
                    <div className="payment-details">
                      <h4>
                        {paymentData.method === "cod"
                          ? "Cash on Delivery"
                          : paymentData.gateway === "cashfree"
                            ? "Online Payment via Cashfree"
                            : paymentData.gateway === "razorpay"
                              ? "Online Payment via Razorpay"
                              : "Online Payment"}
                      </h4>
                      <p>
                        {paymentData.method === "cod"
                          ? "Pay when order arrives"
                          : "Secure payment gateway"}
                      </p>
                    </div>
                    <button
                      className="change-payment-btn"
                      onClick={() => {
                        setPaymentData(null);
                        setShowPaymentMethods(false);
                        setSelectedSubMethod(null);
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Gateway Selection for Online Payments */}
              {showPaymentMethods && !paymentData && (
                <div className="payment-gateway-selection">
                  <h4>Choose Payment Gateway</h4>

                  <div className="gateway-options">
                    <div
                      className="gateway-option"
                      onClick={() => {
                        setPaymentData({
                          method: "razorpay",
                          gateway: "razorpay",
                        });
                        setSelectedPaymentGateway("razorpay");
                        setShowPaymentMethods(false);
                        setCurrentStep(3);
                      }}
                    >
                      <div className="gateway-icon">💳</div>
                      <div className="gateway-info">
                        <h5>Razorpay</h5>
                        <p>All cards, UPI, wallets, net banking</p>
                      </div>
                    </div>

                    <div
                      className="gateway-option"
                      onClick={() => {
                        setPaymentData({
                          method: "cashfree",
                          gateway: "cashfree",
                        });
                        setSelectedPaymentGateway("cashfree");
                        setShowPaymentMethods(false);
                        setCurrentStep(3);
                      }}
                    >
                      <div className="gateway-icon">🔒</div>
                      <div className="gateway-info">
                        <h5>Cashfree</h5>
                        <p>Secure payments, all major payment methods</p>
                      </div>
                    </div>
                  </div>

                  <button
                    className="back-to-payment-methods"
                    onClick={() => setShowPaymentMethods(false)}
                  >
                    ← Back to Payment Options
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sub Payment Methods for Cashfree */}
          {showPaymentMethods && paymentData?.gateway === "cashfree" && (
            <div className="sub-payment-methods">
              <h4>Choose Payment Method</h4>
              <div className="sub-methods-grid">
                {[
                  {
                    id: "card",
                    name: "Credit/Debit Card",
                    icon: "💳",
                    desc: "Visa, Mastercard, RuPay",
                  },
                  {
                    id: "upi",
                    name: "UPI",
                    icon: "📱",
                    desc: "PhonePe, GPay, Paytm",
                  },
                  {
                    id: "netbanking",
                    name: "Net Banking",
                    icon: "🏦",
                    desc: "All major banks",
                  },
                  {
                    id: "wallet",
                    name: "Digital Wallet",
                    icon: "💼",
                    desc: "Paytm, PhonePe wallet",
                  },
                ].map((method) => (
                  <div
                    key={method.id}
                    className={`sub-payment-option ${selectedSubMethod === method.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedSubMethod(method.id);
                      setPaymentData({
                        method: "cashfree",
                        gateway: "cashfree",
                        subMethod: method.id,
                      });
                      setCurrentStep(3); // Now go to step 3
                    }}
                  >
                    <div className="sub-payment-icon">{method.icon}</div>
                    <div className="sub-payment-info">
                      <h5>{method.name}</h5>
                      <p>{method.desc}</p>
                    </div>
                    <div className="sub-payment-radio">
                      {selectedSubMethod === method.id && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="back-to-payment-methods"
                onClick={() => {
                  setShowPaymentMethods(false);
                  setSelectedSubMethod(null);
                  setPaymentData(null);
                }}
              >
                ← Back to Payment Options
              </button>
            </div>
          )}
          {/* Order Summary Section */}
          {currentStep >= 3 && (
            <div className="checkout-section">
              <div className="section-header">
                <div className="section-icon">🛍️</div>
                <div className="section-info">
                  <h3>Order Summary</h3>
                  <p>Review your order details</p>
                </div>
              </div>

              <div className="order-items">
                {items?.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="item-image">
                      <img
                        src={
                          item.product?.images?.[0]?.url ||
                          "/placeholder-product.jpg"
                        }
                        alt={item.product?.name}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.product?.name}</h4>
                      <p>{item.product?.supplier?.companyName}</p>
                      <div className="item-quantity">Qty: {item.quantity}</div>
                    </div>
                    <div className="item-price">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bill-details">
                <h4>Bill Details</h4>

                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{originalSubtotal.toLocaleString()}</span>
                </div>

                {/* Show discount breakdown if any discounts are applied */}
                {couponDiscount > 0 && (
                  <div className="bill-row discount">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span className="discount-amount">
                      -₹{couponDiscount.toLocaleString()}
                    </span>
                  </div>
                )}

                {coinDiscount > 0 && (
                  <div className="bill-row discount">
                    <span>Coins Used ({appliedCoins?.coinsUsed})</span>
                    <span className="discount-amount">
                      -₹{coinDiscount.toLocaleString()}
                    </span>
                  </div>
                )}

                {totalDiscount > 0 && (
                  <div className="bill-row subtotal-after-discount">
                    <span>Subtotal after discount</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="bill-row">
                  <span>Platform Fee (5%)</span>
                  <span>₹{commission.toLocaleString()}</span>
                </div>
                <div className="bill-row">
                  <span>
                    Delivery Fee
                    {isCalculatingDelivery && (
                      <span style={{ color: "#007bff", marginLeft: "8px" }}>
                        (Calculating...)
                      </span>
                    )}
                    {deliveryCalculationError && (
                      <span
                        style={{ color: "#dc3545", marginLeft: "8px" }}
                        title={deliveryCalculationError}
                      >
                        ⚠️
                      </span>
                    )}
                  </span>
                  <span>
                    {isCalculatingDelivery ? (
                      <span style={{ color: "#007bff" }}>...</span>
                    ) : deliveryFee === 0 ? (
                      "FREE"
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="bill-row">
                  <span>Packaging Charges</span>
                  <span>₹{packagingCharges}</span>
                </div>
                {selectedAddressId && customerDeliveryState && (
                  <GSTBreakdown
                    customerState={customerDeliveryState}
                    items={items}
                    onGSTUpdate={(gstData) => setGstBreakdownData(gstData)}
                  />
                )}

                <div className="bill-row total">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>

                {/* Show advance payment details for online payments */}
                {paymentAmounts.isAdvancePayment && (
                  <>
                    <div className="bill-separator"></div>
                    <div className="advance-payment-section">
                      <h5>Payment Breakdown</h5>

                      <div className="bill-row advance-payment">
                        <span>
                          Advance Payment ({paymentAmounts.advancePercentage}%)
                        </span>
                        <span className="advance-amount">
                          ₹{paymentAmounts.advanceAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="bill-row remaining-payment">
                        <span>Remaining Amount</span>
                        <span className="remaining-amount">
                          ₹{paymentAmounts.remainingAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="payment-note">
                        <small>
                          💡 You'll pay ₹
                          {paymentAmounts.advanceAmount.toLocaleString()} now.
                          Remaining ₹
                          {paymentAmounts.remainingAmount.toLocaleString()} will
                          be collected on delivery.
                        </small>
                      </div>
                    </div>
                  </>
                )}

                {paymentAmounts.isAdvancePayment &&
                  paymentAmounts.percentageOptions.length > 1 && (
                    <>
                      <div className="bill-separator"></div>
                      <div className="advance-options-section">
                        <h5>Choose Advance Payment Amount</h5>
                        <div className="advance-options-grid">
                          {paymentAmounts.percentageOptions
                            .filter((option) => option.isActive)
                            .map((option) => (
                              <div
                                key={option.percentage}
                                className={`advance-option ${
                                  paymentAmounts.advancePercentage ===
                                  option.percentage
                                    ? "selected"
                                    : ""
                                }`}
                                onClick={() => {
                                  const newAdvanceAmount = Math.round(
                                    (finalTotal * option.percentage) / 100
                                  );
                                  const newRemainingAmount =
                                    finalTotal - newAdvanceAmount;

                                  setPaymentAmounts((prev) => ({
                                    ...prev,
                                    advancePercentage: option.percentage,
                                    advanceAmount: newAdvanceAmount,
                                    remainingAmount: newRemainingAmount,
                                  }));
                                }}
                              >
                                <div className="option-percentage">
                                  {option.percentage}%
                                </div>
                                <div className="option-label">
                                  {option.label}
                                </div>
                                <div className="option-amount">
                                  ₹
                                  {Math.round(
                                    (finalTotal * option.percentage) / 100
                                  ).toLocaleString()}
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="selected-option-summary">
                          <p>
                            💡 You'll pay ₹
                            {paymentAmounts.advanceAmount.toLocaleString()} now.
                            Remaining ₹
                            {paymentAmounts.remainingAmount.toLocaleString()}{" "}
                            will be collected on delivery.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                {/* Show COD note */}
                {paymentData?.method === "cod" && (
                  <div className="payment-note cod-note">
                    <small>
                      💰 Full amount (₹{finalTotal.toLocaleString()}) will be
                      collected on delivery
                    </small>
                  </div>
                )}
              </div>
              <div className="delivery-info">
                <div className="delivery-time">
                  <span className="delivery-icon">🕐</span>
                  <span>Estimated delivery: {estimatedDelivery}</span>
                </div>
                {detectedLocation && (
                  <div className="location-info">
                    <span className="location-icon">📍</span>
                    <span>Delivering to: {detectedLocation.city}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Place Order Button */}

        {/* Place Order Button */}
        {currentStep >= 3 && shippingData && paymentData && (
          <div className="place-order-section">
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="place-order-btn"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner />
                  Processing Order...
                </>
              ) : (
                <>
                  {paymentData.method === "cod" ? (
                    <>Place Order • ₹{finalTotal.toLocaleString()}</>
                  ) : (
                    <>
                      Pay ₹{paymentAmounts.advanceAmount.toLocaleString()} &
                      Place Order
                    </>
                  )}
                </>
              )}
            </button>

            <div className="order-note">
              <p>By placing this order, you agree to our Terms & Conditions</p>
              {paymentAmounts.isAdvancePayment && (
                <p className="advance-note">
                  <small>
                    This is an advance payment of{" "}
                    {paymentAmounts.advancePercentage}% of total amount
                  </small>
                </p>
              )}
            </div>
          </div>
        )}
        {/* Payment Gateway Modal */}

        {/* Payment Gateway Modal */}

        {/* Payment Gateway Modal - Opens immediately for online payments */}

        {/* Payment Gateway Modal - Opens immediately for online payments */}
        {showPaymentGateway && orderCreated && (
          <div
            className="payment-gateway-wrapper"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 15000, // HIGHER than OrderPlacementOverlay
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedPaymentGateway === "razorpay" && (
              <RazorpayPayment
                orderData={{
                  ...orderCreated,
                  totalAmount:
                    orderCreated.payment?.advanceAmount ||
                    orderCreated.pricing?.totalAmount,
                  payment: {
                    ...orderCreated.payment,
                    advanceAmount:
                      orderCreated.payment?.advanceAmount ||
                      orderCreated.pricing?.totalAmount,
                  },
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => {
                  handlePaymentError({ message: "Payment cancelled by user" });
                }}
              />
            )}

            {selectedPaymentGateway === "cashfree" && (
              <CashfreePayment
                orderData={{
                  ...orderCreated,
                  totalAmount:
                    orderCreated.payment?.advanceAmount ||
                    orderCreated.pricing?.totalAmount,
                  payment: {
                    ...orderCreated.payment,
                    advanceAmount:
                      orderCreated.payment?.advanceAmount ||
                      orderCreated.pricing?.totalAmount,
                  },
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => {
                  handlePaymentError({ message: "Payment cancelled by user" });
                }}
              />
            )}
          </div>
        )}

        {/* Order Animation Overlay - Only shows for COD or after payment success */}
        <OrderPlacementOverlay
          isVisible={showOrderAnimation}
          onClose={handleCloseOrderAnimation}
          orderDetails={orderAnimationData}
          showProcessingSteps={true}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;

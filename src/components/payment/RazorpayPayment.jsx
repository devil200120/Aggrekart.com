import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { paymentsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const RazorpayPayment = ({ orderData, onSuccess, onError, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (scriptLoaded && orderData && user) {
      // Auto-initiate payment when component mounts
      handlePayment();
    }
  }, [scriptLoaded, orderData, user]);

  const loadRazorpayScript = () => {
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      toast.error("Payment system failed to load");
      onError && onError({ message: "SDK load failed" });
    };
    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    if (!scriptLoaded || !orderData || !user) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log("💳 Creating Razorpay payment order...");

      // Create payment order with your backend
      const response = await paymentsAPI.createPaymentOrder({
        orderId: orderData.orderId,
        amount: orderData.payment?.advanceAmount || orderData.totalAmount,
      });

      console.log("💳 Razorpay order response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to create payment order");
      }

      const { paymentOrderId, amount, currency, key } = response;

      const options = {
        key: key,
        amount: amount * 100, // Convert to paise
        currency: currency,
        name: "AggreKart",
        description: `Payment for Order ${orderData.orderId}`,
        order_id: paymentOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phoneNumber,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async (response) => {
          try {
            console.log("✅ Razorpay payment successful:", response);

            // Verify payment with backend
            const verifyResponse = await paymentsAPI.verifyPayment({
              orderId: paymentOrderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              toast.success("Payment completed successfully!");
              onSuccess &&
                onSuccess({
                  orderId: orderData.orderId,
                  paymentId: response.razorpay_payment_id,
                  transactionId: response.razorpay_payment_id,
                  amount: amount,
                  status: "success",
                });
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("❌ Payment verification error:", error);
            toast.error("Payment verification failed");
            onError && onError(error);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Payment cancelled by user");
            setIsProcessing(false);
            onCancel && onCancel();
          },
        },
      };

      console.log("💳 Opening Razorpay checkout...");

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("❌ Razorpay payment error:", error);
      setIsProcessing(false);
      toast.error(error.message || "Payment failed");
      onError && onError(error);
    }
  };

  return (
    <div className="payment-overlay">
      <div className="payment-modal">
        <div className="payment-content">
          <Loader2 className="loading-spinner" />
          <h3>Processing Payment...</h3>
          <p>Please wait while we redirect you to Razorpay</p>
          <div className="payment-details">
            <p>
              <strong>Order:</strong> {orderData?.orderId}
            </p>
            <p>
              <strong>Amount:</strong> ₹
              {orderData?.payment?.advanceAmount || orderData?.totalAmount}
            </p>
          </div>
          <button onClick={onCancel} className="cancel-btn">
            Cancel Payment
          </button>
        </div>
      </div>

      <style jsx>{`
        .payment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .payment-modal {
          background: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto 20px;
          color: #3b82f6;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RazorpayPayment;

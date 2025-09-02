import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { cartAPI } from "../services/api";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

const CartContext = createContext();

// Clean cart reducer with discount support
const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_CART": {
      const items = action.payload.items || [];

      // Ensure each item has proper price structure
      const processedItems = items.map((item) => ({
        ...item,
        price:
          item.priceAtTime ||
          item.price ||
          item.product?.pricing?.basePrice ||
          0,
        product: {
          ...item.product,
          price: item.product?.pricing?.basePrice || item.product?.price || 0,
          unit: item.product?.pricing?.unit || item.product?.unit || "unit",
        },
      }));

      // Calculate base totals
      const total = processedItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemPrice * itemQuantity;
      }, 0);

      const itemCount = processedItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemQuantity;
      }, 0);

      return {
        ...state,
        items: processedItems,
        total: parseFloat(total) || 0,
        itemCount: parseFloat(itemCount) || 0,
        // Discount fields from backend
        // Discount fields from backend
        // Discount fields from backend
        appliedCoupon: action.payload.appliedCoupon || null,
        appliedCoins: action.payload.appliedCoins || null,
        appliedSupplierPromotion:
          action.payload.appliedSupplierPromotion || null,
        finalAmount: action.payload.finalAmount || parseFloat(total) || 0,
        isLoading: false,
      };
    }

    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case "OPTIMISTIC_ADD": {
      const existingItem = state.items.find(
        (item) =>
          item.product._id === action.payload.productId ||
          item.product.productId === action.payload.productId
      );

      let newItems;
      const productPrice = parseFloat(
        action.payload.product?.pricing?.basePrice ||
          action.payload.product?.price ||
          0
      );
      const addQuantity = parseFloat(action.payload.quantity) || 0;

      if (existingItem) {
        newItems = state.items.map((item) =>
          item.product._id === action.payload.productId ||
          item.product.productId === action.payload.productId
            ? {
                ...item,
                quantity: parseFloat(item.quantity) + addQuantity,
                price: productPrice,
              }
            : item
        );
      } else {
        newItems = [
          ...state.items,
          {
            _id: `temp-${Date.now()}`,
            product: {
              ...action.payload.product,
              price: productPrice,
              unit:
                action.payload.product?.pricing?.unit ||
                action.payload.product?.unit ||
                "unit",
            },
            quantity: addQuantity,
            price: productPrice,
            priceAtTime: productPrice,
          },
        ];
      }

      const newTotal = newItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemPrice * itemQuantity;
      }, 0);

      const newItemCount = newItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemQuantity;
      }, 0);

      return {
        ...state,
        items: newItems,
        total: parseFloat(newTotal) || 0,
        itemCount: parseFloat(newItemCount) || 0,
        // Clear discounts when cart changes
        appliedCoupon: null,
        appliedCoins: null,
        finalAmount: parseFloat(newTotal) || 0,
      };
    }

    case "OPTIMISTIC_UPDATE": {
      const updatedItems = state.items.map((item) =>
        item._id === action.payload.itemId
          ? { ...item, quantity: parseFloat(action.payload.quantity) || 0 }
          : item
      );

      const updatedTotal = updatedItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemPrice * itemQuantity;
      }, 0);

      const updatedItemCount = updatedItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemQuantity;
      }, 0);

      return {
        ...state,
        items: updatedItems,
        total: parseFloat(updatedTotal) || 0,
        itemCount: parseFloat(updatedItemCount) || 0,
        // Clear discounts when cart changes
        appliedCoupon: null,
        appliedCoins: null,
        finalAmount: parseFloat(updatedTotal) || 0,
      };
    }

    case "OPTIMISTIC_REMOVE": {
      const filteredItems = state.items.filter(
        (item) => item._id !== action.payload.itemId
      );

      const filteredTotal = filteredItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemPrice * itemQuantity;
      }, 0);

      const filteredItemCount = filteredItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0;
        return sum + itemQuantity;
      }, 0);

      return {
        ...state,
        items: filteredItems,
        total: parseFloat(filteredTotal) || 0,
        itemCount: parseFloat(filteredItemCount) || 0,
        // Clear discounts when cart changes
        appliedCoupon: null,
        appliedCoins: null,
        finalAmount: parseFloat(filteredTotal) || 0,
      };
    }

    case "CLEAR_CART": {
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        appliedCoupon: null,
        appliedCoins: null,
        finalAmount: 0,
      };
    }

    default: {
      return state;
    }
  }
};

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  appliedCoupon: null,
  appliedCoins: null,
  appliedSupplierPromotion: null,
  finalAmount: 0,
  isLoading: true,
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cartState, dispatch] = useReducer(cartReducer, initialState);

  // Fetch cart data
  const {
    data: cartData,
    isLoading,
    error,
  } = useQuery("cart", cartAPI.getCart, {
    enabled: !!user && user.role === "customer",
    onSuccess: (response) => {
      console.log("Cart response:", response);

      const cartData =
        response?.data?.cart || response?.cart || response?.data || {};
      const items = cartData.items || [];

      console.log("Processing cart items:", items);
      console.log("Cart discount data:", {
        appliedCoupon: cartData.appliedCoupon,
        appliedCoins: cartData.appliedCoins,
        appliedSupplierPromotion: cartData.appliedSupplierPromotion,
        finalAmount: cartData.finalAmount,
      });

      dispatch({
        type: "SET_CART",
        payload: {
          items: items,
          total: cartData.totalAmount || 0,
          itemCount: cartData.totalItems || 0,
          appliedCoupon: cartData.appliedCoupon,
          appliedCoins: cartData.appliedCoins,
          appliedSupplierPromotion: cartData.appliedSupplierPromotion,
          finalAmount: cartData.finalAmount,
        },
      });
    },
    onError: (error) => {
      console.error("Failed to fetch cart:", error);
      dispatch({ type: "SET_LOADING", payload: false });

      if (error?.response?.status !== 404) {
        toast.error("Failed to load cart");
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation(
    (data) => {
      console.log("Adding to cart:", data);
      return cartAPI.addToCart(data);
    },
    {
      onMutate: async (variables) => {
        dispatch({
          type: "OPTIMISTIC_ADD",
          payload: variables,
        });
      },
      onSuccess: (response) => {
        console.log("Add to cart success:", response);

        const cartData =
          response?.data?.cart || response?.cart || response?.data || {};

        dispatch({
          type: "SET_CART",
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0,
            appliedCoupon: cartData.appliedCoupon,
            appliedCoins: cartData.appliedCoins,
            finalAmount: cartData.finalAmount,
          },
        });

        queryClient.invalidateQueries("cart");
        toast.success("Item added to cart");
      },
      onError: (error) => {
        console.error("Add to cart error:", error);
        queryClient.invalidateQueries("cart");
        toast.error(
          error.response?.data?.message || "Failed to add item to cart"
        );
      },
    }
  );

  // Update cart item mutation
  const updateCartMutation = useMutation(
    ({ itemId, quantity }) => {
      console.log("Updating cart item:", { itemId, quantity });
      return cartAPI.updateCartItem(itemId, { quantity });
    },
    {
      onMutate: async (variables) => {
        dispatch({
          type: "OPTIMISTIC_UPDATE",
          payload: variables,
        });
      },
      onSuccess: (response) => {
        console.log("Update cart success:", response);

        const cartData =
          response?.data?.cart || response?.cart || response?.data || {};

        dispatch({
          type: "SET_CART",
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0,
            appliedCoupon: cartData.appliedCoupon,
            appliedCoins: cartData.appliedCoins,
            finalAmount: cartData.finalAmount,
          },
        });

        queryClient.invalidateQueries("cart");
      },
      onError: (error) => {
        console.error("Update cart error:", error);
        queryClient.invalidateQueries("cart");
        toast.error(error.response?.data?.message || "Failed to update cart");
      },
    }
  );

  // Remove from cart mutation
  const removeFromCartMutation = useMutation(
    (itemId) => {
      console.log("Removing cart item:", itemId);
      return cartAPI.removeFromCart(itemId);
    },
    {
      onMutate: async (itemId) => {
        dispatch({
          type: "OPTIMISTIC_REMOVE",
          payload: { itemId },
        });
      },
      onSuccess: (response) => {
        console.log("Remove cart success:", response);

        const cartData =
          response?.data?.cart || response?.cart || response?.data || {};

        dispatch({
          type: "SET_CART",
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0,
            appliedCoupon: cartData.appliedCoupon,
            appliedCoins: cartData.appliedCoins,
            finalAmount: cartData.finalAmount,
          },
        });

        queryClient.invalidateQueries("cart");
        toast.success("Item removed from cart");
      },
      onError: (error) => {
        console.error("Remove cart error:", error);
        queryClient.invalidateQueries("cart");
        toast.error(error.response?.data?.message || "Failed to remove item");
      },
    }
  );

  // Clear cart mutation
  const clearCartMutation = useMutation(
    () => {
      console.log("Clearing cart...");
      return cartAPI.clearCart();
    },
    {
      onMutate: async () => {
        dispatch({ type: "CLEAR_CART" });
      },
      onSuccess: () => {
        console.log("Clear cart success");
        queryClient.invalidateQueries("cart");
        toast.success("Cart cleared");
      },
      onError: (error) => {
        console.error("Clear cart error:", error);
        queryClient.invalidateQueries("cart");
        toast.error(error.response?.data?.message || "Failed to clear cart");
      },
    }
  );

  // Action functions
  const addToCart = async (productId, quantity, product) => {
    const parsedQuantity = parseFloat(quantity);

    if (parsedQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    return addToCartMutation.mutateAsync({
      productId,
      quantity: parsedQuantity,
      product,
    });
  };

  const updateCartItem = async (itemId, quantity) => {
    const parsedQuantity = parseFloat(quantity);

    if (parsedQuantity <= 0) {
      return removeFromCart(itemId);
    }

    return updateCartMutation.mutateAsync({ itemId, quantity: parsedQuantity });
  };

  const removeFromCart = async (itemId) => {
    return removeFromCartMutation.mutateAsync(itemId);
  };

  const clearCart = async () => {
    return clearCartMutation.mutateAsync();
  };

  const refreshCart = async () => {
    if (!user || user.role !== "customer") {
      console.log("No customer user logged in, skipping cart refresh");
      return;
    }

    try {
      console.log("Refreshing cart...");
      await queryClient.refetchQueries("cart");
      console.log("Cart refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh cart:", error);
    }
  };

  const getCartItemByProductId = (productId) => {
    return cartState.items.find(
      (item) =>
        item.product._id === productId || item.product.productId === productId
    );
  };

  const value = {
    // State
    items: cartState.items || [],
    total: parseFloat(cartState.total) || 0,
    itemCount: parseFloat(cartState.itemCount) || 0,
    isLoading: isLoading || cartState.isLoading,
      appliedCoupon: cartState.appliedCoupon || null,
    appliedCoins: cartState.appliedCoins || null,
    appliedSupplierPromotion: cartState.appliedSupplierPromotion || null,
    finalAmount:
      parseFloat(cartState.finalAmount) || parseFloat(cartState.total) || 0,

    // Actions
    addToCart,
    updateCartItem,
        removeFromCart,
    clearCart,
    dispatch,
    refreshCart,
    getCartItemByProductId,

    // Mutation states
    isAdding: addToCartMutation.isLoading,
    isUpdating: updateCartMutation.isLoading,
    isRemoving: removeFromCartMutation.isLoading,
    isClearing: clearCartMutation.isLoading,

    // Error state
    error: error,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

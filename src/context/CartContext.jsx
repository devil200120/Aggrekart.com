import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { cartAPI } from '../services/api'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

const CartContext = createContext()

// Cart reducer for local state management
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART': {
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        itemCount: action.payload.itemCount || 0,
        isLoading: false
      }
    }
    
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload
      }
    }
    
    case 'OPTIMISTIC_ADD': {
      const existingItem = state.items.find(item => item.product._id === action.payload.productId)
      let newItems
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.product._id === action.payload.productId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...state.items, {
          _id: `temp-${Date.now()}`,
          product: action.payload.product,
          quantity: action.payload.quantity,
          price: action.payload.product.price
        }]
      }
      
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        itemCount: newItemCount
      }
    }
    
    case 'OPTIMISTIC_UPDATE': {
      const updatedItems = state.items.map(item =>
        item._id === action.payload.itemId
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      
      const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const updatedItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return {
        ...state,
        items: updatedItems,
        total: updatedTotal,
        itemCount: updatedItemCount
      }
    }
    
    case 'OPTIMISTIC_REMOVE': {
      const filteredItems = state.items.filter(item => item._id !== action.payload.itemId)
      const filteredTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const filteredItemCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return {
        ...state,
        items: filteredItems,
        total: filteredTotal,
        itemCount: filteredItemCount
      }
    }
    
    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0
      }
    }
    
    default: {
      return state
    }
  }
}

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: true
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [cartState, dispatch] = useReducer(cartReducer, initialState)

  // Fetch cart data
  // Replace lines 115-130 with:

  // Fetch cart data
  const { data: cartData, isLoading } = useQuery(
    'cart',
    cartAPI.getCart,
    {
      enabled: !!user && user.role === 'customer',
      onSuccess: (response) => {
        // Extract cart data from nested response structure
        const cartData = response.data?.cart || response.cart || {};
        
        dispatch({ 
          type: 'SET_CART', 
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0
          }
        });
      },
      onError: (error) => {
        console.error('Failed to fetch cart:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )
  // Add to cart mutation
  // Replace lines 135-150 with:

  // Add to cart mutation
  const addToCartMutation = useMutation(
    (data) => cartAPI.addToCart(data),
    {
      onMutate: async (variables) => {
        // Optimistic update
        dispatch({
          type: 'OPTIMISTIC_ADD',
          payload: variables
        })
      },
      // Replace the updateCartMutation onSuccess (around line 168):

      onSuccess: (response) => {
        const cartData = response.data?.cart || response.cart || {};
        
        dispatch({ 
          type: 'SET_CART', 
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0
          }
        });
        queryClient.invalidateQueries('cart')
      },
      onError: (error) => {
        // Revert optimistic update
        queryClient.invalidateQueries('cart')
        toast.error(error.response?.data?.message || 'Failed to add item to cart')
      }
    }
  )
  // Update cart item mutation
  const updateCartMutation = useMutation(
    ({ itemId, quantity }) => cartAPI.updateCartItem(itemId, { quantity }),
    {
      onMutate: async (variables) => {
        // Optimistic update
        dispatch({
          type: 'OPTIMISTIC_UPDATE',
          payload: variables
        })
      },
      onSuccess: (data) => {
        dispatch({ type: 'SET_CART', payload: data })
        queryClient.invalidateQueries('cart')
      },
      onError: (error) => {
        // Revert optimistic update
        queryClient.invalidateQueries('cart')
        toast.error(error.response?.data?.message || 'Failed to update cart')
      }
    }
  )

  // Remove from cart mutation
  const removeFromCartMutation = useMutation(
    (itemId) => cartAPI.removeFromCart(itemId),
    {
      onMutate: async (itemId) => {
        // Optimistic update
        dispatch({
          type: 'OPTIMISTIC_REMOVE',
          payload: { itemId }
        })
      },
      onSuccess: (data) => {
        dispatch({ type: 'SET_CART', payload: data })
        queryClient.invalidateQueries('cart')
        toast.success('Item removed from cart')
      },
      onError: (error) => {
        // Revert optimistic update
        queryClient.invalidateQueries('cart')
        toast.error(error.response?.data?.message || 'Failed to remove item')
      }
    }
  )

  // Clear cart mutation
  const clearCartMutation = useMutation(
    () => cartAPI.clearCart(),
    {
      onMutate: () => {
        dispatch({ type: 'CLEAR_CART' })
      },
      onSuccess: () => {
        queryClient.invalidateQueries('cart')
        toast.success('Cart cleared')
      },
      onError: (error) => {
        queryClient.invalidateQueries('cart')
        toast.error(error.response?.data?.message || 'Failed to clear cart')
      }
    }
  )

  // Clear cart when user logs out
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'CLEAR_CART' })
    }
  }, [user])

  // Cart actions
  const addToCart = async (productData) => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    if (user.role !== 'customer') {
      toast.error('Only customers can add items to cart')
      return
    }

    return addToCartMutation.mutateAsync(productData)
  }

  const updateCartItem = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId)
    }
    return updateCartMutation.mutateAsync({ itemId, quantity })
  }

  const removeFromCart = async (itemId) => {
    return removeFromCartMutation.mutateAsync(itemId)
  }

  const clearCart = async () => {
    return clearCartMutation.mutateAsync()
  }

  const getCartItemByProductId = (productId) => {
    return cartState.items.find(item => item.product._id === productId)
  }

  const value = {
    // State
    ...cartState,
    isLoading: isLoading || cartState.isLoading,
    
    // Actions
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemByProductId,
    
    // Mutation states
    isAdding: addToCartMutation.isLoading,
    isUpdating: updateCartMutation.isLoading,
    isRemoving: removeFromCartMutation.isLoading,
    isClearing: clearCartMutation.isLoading,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
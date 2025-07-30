import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { cartAPI } from '../services/api'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

const CartContext = createContext()

// Enhanced cart reducer with proper price handling
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART': {
      const items = action.payload.items || []
      
      // Ensure each item has proper price structure
      const processedItems = items.map(item => ({
        ...item,
        // Map backend price fields to frontend expectations
        price: item.priceAtTime || item.price || item.product?.pricing?.basePrice || 0,
        product: {
          ...item.product,
          // Ensure product has price field
          price: item.product?.pricing?.basePrice || item.product?.price || 0,
          unit: item.product?.pricing?.unit || item.product?.unit || 'unit'
        }
      }))
      
      // Calculate totals with validation
      const total = processedItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + (itemPrice * itemQuantity)
      }, 0)
      
      const itemCount = processedItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + itemQuantity
      }, 0)
      
      return {
        ...state,
        items: processedItems,
        total: parseFloat(total) || 0,
        itemCount: parseFloat(itemCount) || 0,
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
      const existingItem = state.items.find(item => 
        item.product._id === action.payload.productId || 
        item.product.productId === action.payload.productId
      )
      
      let newItems
      const productPrice = parseFloat(action.payload.product?.pricing?.basePrice || action.payload.product?.price || 0)
      const addQuantity = parseFloat(action.payload.quantity) || 0
      
      if (existingItem) {
        newItems = state.items.map(item =>
          (item.product._id === action.payload.productId || item.product.productId === action.payload.productId)
            ? { 
                ...item, 
                quantity: parseFloat(item.quantity) + addQuantity,
                price: productPrice
              }
            : item
        )
      } else {
        newItems = [...state.items, {
          _id: `temp-${Date.now()}`,
          product: {
            ...action.payload.product,
            price: productPrice,
            unit: action.payload.product?.pricing?.unit || action.payload.product?.unit || 'unit'
          },
          quantity: addQuantity,
          price: productPrice,
          priceAtTime: productPrice
        }]
      }
      
      const newTotal = newItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + (itemPrice * itemQuantity)
      }, 0)
      
      const newItemCount = newItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + itemQuantity
      }, 0)
      
      return {
        ...state,
        items: newItems,
        total: parseFloat(newTotal) || 0,
        itemCount: parseFloat(newItemCount) || 0
      }
    }
    
    case 'OPTIMISTIC_UPDATE': {
      const updatedItems = state.items.map(item =>
        item._id === action.payload.itemId
          ? { ...item, quantity: parseFloat(action.payload.quantity) || 0 }
          : item
      )
      
      const updatedTotal = updatedItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + (itemPrice * itemQuantity)
      }, 0)
      
      const updatedItemCount = updatedItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + itemQuantity
      }, 0)
      
      return {
        ...state,
        items: updatedItems,
        total: parseFloat(updatedTotal) || 0,
        itemCount: parseFloat(updatedItemCount) || 0
      }
    }
    
    case 'OPTIMISTIC_REMOVE': {
      const filteredItems = state.items.filter(item => item._id !== action.payload.itemId)
      
      const filteredTotal = filteredItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + (itemPrice * itemQuantity)
      }, 0)
      
      const filteredItemCount = filteredItems.reduce((sum, item) => {
        const itemQuantity = parseFloat(item.quantity) || 0
        return sum + itemQuantity
      }, 0)
      
      return {
        ...state,
        items: filteredItems,
        total: parseFloat(filteredTotal) || 0,
        itemCount: parseFloat(filteredItemCount) || 0
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

  // Fetch cart data with enhanced error handling
  const { data: cartData, isLoading, error } = useQuery(
    'cart',
    cartAPI.getCart,
    {
      enabled: !!user && user.role === 'customer',
      onSuccess: (response) => {
        console.log('Cart response:', response)
        
        // Handle different response structures
        const cartData = response?.data?.cart || response?.cart || response?.data || {}
        
        // Ensure we have items array
        const items = cartData.items || []
        
        console.log('Processing cart items:', items)
        
        dispatch({ 
          type: 'SET_CART', 
          payload: {
            items: items,
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0
          }
        })
      },
      onError: (error) => {
        console.error('Failed to fetch cart:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
        
        // Don't show error toast for 404 (empty cart)
        if (error?.response?.status !== 404) {
          toast.error('Failed to load cart')
        }
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404 errors
        if (error?.response?.status === 404) return false
        return failureCount < 2
      }
    }
  )

  // Add to cart mutation with enhanced error handling
  const addToCartMutation = useMutation(
    (data) => {
      console.log('Adding to cart:', data)
      return cartAPI.addToCart(data)
    },
    {
      onMutate: async (variables) => {
        console.log('Optimistic add:', variables)
        dispatch({
          type: 'OPTIMISTIC_ADD',
          payload: variables
        })
      },
      onSuccess: (response) => {
        console.log('Add to cart success:', response)
        
        const cartData = response?.data?.cart || response?.cart || response?.data || {}
        
        dispatch({ 
          type: 'SET_CART', 
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0
          }
        })
        
        queryClient.invalidateQueries('cart')
        toast.success('Item added to cart')
      },
      onError: (error) => {
        console.error('Add to cart error:', error)
        queryClient.invalidateQueries('cart')
        toast.error(error.response?.data?.message || 'Failed to add item to cart')
      }
    }
  )

  // Update cart item mutation
  const updateCartMutation = useMutation(
    ({ itemId, quantity }) => {
      console.log('Updating cart item:', { itemId, quantity })
      return cartAPI.updateCartItem(itemId, { quantity })
    },
    {
      onMutate: async (variables) => {
        dispatch({
          type: 'OPTIMISTIC_UPDATE',
          payload: variables
        })
      },
      onSuccess: (response) => {
        console.log('Update cart success:', response)
        
        const cartData = response?.data?.cart || response?.cart || response?.data || {}
        
        dispatch({ 
          type: 'SET_CART', 
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0
          }
        })
        
        queryClient.invalidateQueries('cart')
      },
      onError: (error) => {
        console.error('Update cart error:', error)
        queryClient.invalidateQueries('cart')
        toast.error(error.response?.data?.message || 'Failed to update cart')
      }
    }
  )

  // Remove from cart mutation
  const removeFromCartMutation = useMutation(
    (itemId) => {
      console.log('Removing from cart:', itemId)
      return cartAPI.removeFromCart(itemId)
    },
    {
      onMutate: async (itemId) => {
        dispatch({
          type: 'OPTIMISTIC_REMOVE',
          payload: { itemId }
        })
      },
      onSuccess: (response) => {
        console.log('Remove from cart success:', response)
        
        const cartData = response?.data?.cart || response?.cart || response?.data || {}
        
        dispatch({ 
          type: 'SET_CART', 
          payload: {
            items: cartData.items || [],
            total: cartData.totalAmount || 0,
            itemCount: cartData.totalItems || 0
          }
        })
        
        queryClient.invalidateQueries('cart')
        toast.success('Item removed from cart')
      },
      onError: (error) => {
        console.error('Remove from cart error:', error)
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

  // Cart actions with validation
  const addToCart = async (productData) => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    if (user.role !== 'customer') {
      toast.error('Only customers can add items to cart')
      return
    }

    // Validate product data
    if (!productData.productId && !productData.product?._id) {
      toast.error('Invalid product data')
      return
    }

    if (!productData.quantity || productData.quantity <= 0) {
      toast.error('Invalid quantity')
      return
    }

    const formattedData = {
      productId: productData.productId || productData.product._id,
      quantity: parseFloat(productData.quantity),
      specifications: productData.specifications || {},
      product: productData.product
    }

    return addToCartMutation.mutateAsync(formattedData)
  }

  const updateCartItem = async (itemId, quantity) => {
    const parsedQuantity = parseFloat(quantity)
    
    if (parsedQuantity <= 0) {
      return removeFromCart(itemId)
    }
    
    return updateCartMutation.mutateAsync({ itemId, quantity: parsedQuantity })
  }

  const removeFromCart = async (itemId) => {
    return removeFromCartMutation.mutateAsync(itemId)
  }

  const clearCart = async () => {
    return clearCartMutation.mutateAsync()
  }

  const getCartItemByProductId = (productId) => {
    return cartState.items.find(item => 
      item.product._id === productId || 
      item.product.productId === productId
    )
  }

  // Enhanced cart calculations
  const getSubtotal = () => {
    return cartState.items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0
      const itemQuantity = parseFloat(item.quantity) || 0
      return sum + (itemPrice * itemQuantity)
    }, 0)
  }

  const getItemCount = () => {
    return cartState.items.reduce((sum, item) => {
      const itemQuantity = parseFloat(item.quantity) || 0
      return sum + itemQuantity
    }, 0)
  }

  const value = {
    // State
    items: cartState.items || [],
    total: parseFloat(cartState.total) || 0,
    itemCount: parseFloat(cartState.itemCount) || 0,
    isLoading: isLoading || cartState.isLoading,
    
    // Enhanced calculations
    subtotal: getSubtotal(),
    calculatedItemCount: getItemCount(),
    
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
    
    // Error state
    error: error
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
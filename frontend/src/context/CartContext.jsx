import { useEffect, useState } from 'react'
import { CartContext } from './CartContextValue'

const getSavedCart = () => {
  try {
    return JSON.parse(localStorage.getItem('tapmartCart')) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(getSavedCart)

  useEffect(() => {
    localStorage.setItem('tapmartCart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product, quantity = 1) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item._id === product._id)
      if (existingItem) {
        return currentItems.map((item) => item._id === product._id
          ? { ...item, qty: Math.min(item.qty + quantity, product.stock) }
          : item)
      }
      return [...currentItems, { ...product, qty: Math.min(quantity, product.stock) }]
    })
  }

  const updateQuantity = (productId, qty) => {
    setCartItems((currentItems) => currentItems
      .map((item) => item._id === productId
        ? { ...item, qty: Math.max(1, Math.min(qty, item.stock)) }
        : item))
  }

  const removeFromCart = (productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item._id !== productId))
  }

  const clearCart = () => setCartItems([])
  const getCartQuantity = (productId) => cartItems.find((item) => item._id === productId)?.qty || 0
  const itemCount = cartItems.reduce((total, item) => total + item.qty, 0)
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.qty, 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      itemCount,
      subtotal,
      addToCart,
      getCartQuantity,
      updateQuantity,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

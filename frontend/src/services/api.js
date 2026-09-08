const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function optionalAuthHeaders() {
  const token = localStorage.getItem('tapmartToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`, {
    headers: optionalAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Unable to load products right now.')
  }

  return response.json()
}

export async function getAdminProducts() {
  const response = await fetch(`${API_URL}/products/admin`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}` },
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to load admin products.')
  return data
}

export async function getProduct(productId) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    headers: optionalAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Unable to load this product right now.')
  }

  return response.json()
}

export async function createProductReview(productId, rating, comment) {
  const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
    body: JSON.stringify({ rating, comment }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to submit your review.')
  return data
}

export async function createOrder(orderData) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
    body: JSON.stringify(orderData),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to place your order.')
  return data
}

export async function createPaymentOrder(orderId) {
  const response = await fetch(`${API_URL}/payments/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
    body: JSON.stringify({ orderId }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to start payment.')
  return data
}

export async function verifyPayment(paymentData) {
  const response = await fetch(`${API_URL}/payments/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
    body: JSON.stringify(paymentData),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Payment verification failed.')
  return data
}

async function protectedGet(path, fallbackMessage) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}` },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || fallbackMessage)
  return data
}

export function getMyOrders() {
  return protectedGet('/orders/mine', 'Unable to load your orders.')
}

export function getOrder(orderId) {
  return protectedGet(`/orders/${orderId}`, 'Unable to load this order.')
}

export function getAdminStats() {
  return protectedGet('/analytics', 'Unable to load dashboard statistics.')
}

export function getAllOrders() {
  return protectedGet('/orders', 'Unable to load all orders.')
}

export async function updateOrderStatus(orderId, updateData) {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
    body: JSON.stringify(updateData),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to update the order.')
  return data
}

export async function cancelPendingPaymentOrder(orderId) {
  const response = await fetch(`${API_URL}/orders/${orderId}/payment-cancel`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}` },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to cancel unpaid order.')
  return data
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Unable to log in right now.')
  }

  return data
}

async function authRequest(path, body) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Authentication request failed.')
  return data
}

export function registerUser(name, email, password) {
  return authRequest('register', { name, email, password })
}

export function verifyEmail(email, otp) {
  return authRequest('verify-email', { email, otp })
}

export function resendVerificationOtp(email) {
  return authRequest('resend-otp', { email })
}

export async function createProduct(formData) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to create product.')
  return data
}

export async function updateProduct(productId, updateData) {
  const isFormData = updateData instanceof FormData
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PUT',
    headers,
    body: isFormData ? updateData : JSON.stringify(updateData),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to update product.')
  return data
}

export async function deleteProduct(productId) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('tapmartToken') || ''}`,
    },
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Unable to delete product.')
  return data
}


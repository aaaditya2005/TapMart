import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getProducts, getAdminProducts, getMyOrders, getAdminStats, getAllOrders } from '../services/api'

const StoreContext = createContext()

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [adminStats, setAdminStats] = useState(null)
  const [adminOrders, setAdminOrders] = useState([])
  const [isProductsLoaded, setIsProductsLoaded] = useState(false)
  const [isMyOrdersLoaded, setIsMyOrdersLoaded] = useState(false)
  const [isAdminLoaded, setIsAdminLoaded] = useState(false)

  const fetchProducts = useCallback(async (force = false) => {
    if (isProductsLoaded && products.length > 0 && !force) return products
    try {
      const data = await getProducts()
      setProducts(data)
      setIsProductsLoaded(true)
      return data
    } catch (err) {
      console.error('Failed to fetch products:', err)
      return []
    }
  }, [isProductsLoaded, products])

  const fetchMyOrders = useCallback(async (force = false) => {
    const token = localStorage.getItem('tapmartToken')
    if (!token) return []
    if (isMyOrdersLoaded && myOrders.length > 0 && !force) return myOrders
    try {
      const data = await getMyOrders()
      setMyOrders(data)
      setIsMyOrdersLoaded(true)
      return data
    } catch (err) {
      console.error('Failed to fetch my orders:', err)
      return []
    }
  }, [isMyOrdersLoaded, myOrders])

  const fetchAdminData = useCallback(async (force = false) => {
    const token = localStorage.getItem('tapmartToken')
    if (!token) return
    if (isAdminLoaded && adminOrders.length > 0 && !force) return { stats: adminStats, orders: adminOrders, products }
    try {
      const [statsData, ordersData, productsData] = await Promise.all([
        getAdminStats(),
        getAllOrders(),
        getAdminProducts()
      ])
      setAdminStats(statsData)
      setAdminOrders(ordersData)
      setProducts(productsData)
      setIsAdminLoaded(true)
      setIsProductsLoaded(true)
      return { stats: statsData, orders: ordersData, products: productsData }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    }
  }, [isAdminLoaded, adminStats, adminOrders, products])

  const addOrderToStore = useCallback((order) => {
    if (!order) return
    setMyOrders((prev) => [order, ...prev.filter((o) => (o._id || o.id) !== (order._id || order.id))])
    setAdminOrders((prev) => [order, ...prev.filter((o) => (o._id || o.id) !== (order._id || order.id))])
  }, [])

  const refreshAllData = useCallback(async () => {
    const token = localStorage.getItem('tapmartToken')
    if (token) {
      getMyOrders().then(setMyOrders).catch(() => {})
      getAllOrders().then(setAdminOrders).catch(() => {})
      getAdminStats().then(setAdminStats).catch(() => {})
    }
    getProducts().then(setProducts).catch(() => {})
  }, [])

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data)
        setIsProductsLoaded(true)
      })
      .catch(() => {})

    const token = localStorage.getItem('tapmartToken')
    if (token) {
      getMyOrders()
        .then((data) => {
          setMyOrders(data)
          setIsMyOrdersLoaded(true)
        })
        .catch(() => {})
      
      getAllOrders()
        .then((data) => {
          setAdminOrders(data)
          setIsAdminLoaded(true)
        })
        .catch(() => {})

      getAdminStats()
        .then((data) => {
          setAdminStats(data)
        })
        .catch(() => {})
    }
  }, [])

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        myOrders,
        setMyOrders,
        adminStats,
        setAdminStats,
        adminOrders,
        setAdminOrders,
        isProductsLoaded,
        isMyOrdersLoaded,
        isAdminLoaded,
        fetchProducts,
        fetchMyOrders,
        fetchAdminData,
        addOrderToStore,
        refreshAllData
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)

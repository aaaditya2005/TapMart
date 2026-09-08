import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Contact from './pages/Contact'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Footer from './components/Footer'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TermsConditions from './pages/TermsConditions'
import VerifyEmail from './pages/VerifyEmail'
import OrderSuccess from './pages/OrderSuccess'
import ProtectedRoute from './components/ProtectedRoute'
import MyOrders from './pages/MyOrders'
import OrderDetails from './pages/OrderDetails'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import CustomerRoute from './components/CustomerRoute'
import { StoreProvider } from './context/StoreContext'

const App = () => {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="app-main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<CustomerRoute><Products /></CustomerRoute>} />
              <Route path="/products/:productId" element={<CustomerRoute><ProductDetails /></CustomerRoute>} />
              <Route path="/cart" element={<CustomerRoute><Cart /></CustomerRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CustomerRoute><Checkout /></CustomerRoute></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><CustomerRoute><OrderSuccess /></CustomerRoute></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><CustomerRoute><MyOrders /></CustomerRoute></ProtectedRoute>} />
              <Route path="/orders/:orderId" element={<ProtectedRoute><CustomerRoute><OrderDetails /></CustomerRoute></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </StoreProvider>
  )
}

export default App

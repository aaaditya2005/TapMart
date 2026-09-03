import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

export default AdminRoute

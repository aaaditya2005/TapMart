import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function CustomerRoute({ children }) {
  const { user } = useAuth()

  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

export default CustomerRoute
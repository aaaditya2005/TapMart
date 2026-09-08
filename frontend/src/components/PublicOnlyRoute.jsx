import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function PublicOnlyRoute({ children }) {
  const { user } = useAuth()

  if (!user) return children
  return <Navigate to={user.role === 'admin' ? '/admin' : '/products'} replace />
}

export default PublicOnlyRoute
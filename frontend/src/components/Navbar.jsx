import Brand from './Brand'
import './Navbar.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  const isAdmin = user?.role === 'admin'

  return (
    <header className="site-header">
      <Brand />
      <nav className="site-nav" aria-label="Main navigation">
        {!isAdmin && <Link to="/products">Shop</Link>}
        {!isAdmin && <Link to="/cart">Cart ({itemCount})</Link>}
        {user ? (
          <>
            {!isAdmin && <Link to="/orders">My orders</Link>}
            {isAdmin && <Link to="/admin">Dashboard</Link>}
            <span className="nav-user">Hi, {user.name || user.username}</span>
            <button className="nav-logout" type="button" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link className="nav-signup" to="/signup">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  )
} 

export default Navbar

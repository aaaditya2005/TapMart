import Brand from './Brand'
import './Navbar.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useState } from 'react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = user?.role === 'admin'

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <Brand />
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        {!isAdmin && <Link to="/products" onClick={closeMenu}>Shop</Link>}
        {!isAdmin && <Link to="/cart" onClick={closeMenu}>Cart ({itemCount})</Link>}
        {user ? (
          <>
            {!isAdmin && <Link to="/orders" onClick={closeMenu}>My orders</Link>}
            {isAdmin && <Link to="/admin" onClick={closeMenu}>Dashboard</Link>}
            <span className="nav-user">Hi, {user.name || user.username}</span>
            <button className="nav-logout" type="button" onClick={() => { logout(); closeMenu() }}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link className="nav-signup" to="/signup" onClick={closeMenu}>Sign up</Link>
          </>
        )}
      </nav>
      {menuOpen && <button className="nav-overlay" type="button" aria-label="Close navigation menu" onClick={closeMenu} />}
    </header>
  )
} 

export default Navbar

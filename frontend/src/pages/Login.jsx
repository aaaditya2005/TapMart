import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/products')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="auth-page">
      <p className="eyebrow">Welcome back</p>
      <h1>Log in to TapMart</h1>
      <p className="auth-intro">Access your account, orders, and saved details.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="auth-field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="auth-switch">New to TapMart? <Link to="/signup">Create an account</Link></p>
    </main>
  )
}

export default Login
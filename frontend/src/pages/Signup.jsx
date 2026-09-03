import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/api'
import './Auth.css'

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await registerUser(form.name, form.email, form.password)
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <p className="eyebrow">Join TapMart</p>
      <h1>Create your account</h1>
      <p className="auth-intro">Create an account to shop, track orders, and manage your details.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">Name<input name="name" value={form.name} onChange={updateField} required /></label>
        <label className="auth-field">Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
        <label className="auth-field">Password<input name="password" type="password" value={form.password} onChange={updateField} minLength="8" required /></label>
        <label className="auth-field">Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </main>
  )
}

export default Signup

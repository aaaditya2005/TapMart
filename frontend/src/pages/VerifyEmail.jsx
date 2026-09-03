import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { resendVerificationOtp, verifyEmail } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const data = await verifyEmail(email, otp)
      completeLogin(data)
      navigate('/products')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    try {
      await resendVerificationOtp(email)
      setMessage('A new verification code has been sent.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="auth-page">
      <p className="eyebrow">Verify your email</p>
      <h1>Confirm your account</h1>
      <p className="auth-intro">Enter the six-digit code sent to your email address.</p>
      <form className="auth-form" onSubmit={handleVerify}>
        <label className="auth-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="auth-field">Verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value)} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify email'}</button>
      </form>
      <div className="auth-actions">
        <button className="auth-secondary" type="button" onClick={handleResend}>Resend code</button>
        <Link className="auth-link" to="/login">Back to login</Link>
      </div>
    </main>
  )
}

export default VerifyEmail

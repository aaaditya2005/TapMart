import { useState } from 'react'
import { loginUser } from '../services/api'
import { AuthContext } from './AuthContextValue'

const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('tapmartUser'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser)
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const userData = await loginUser(email, password)
      localStorage.setItem('tapmartToken', userData.token)
      localStorage.setItem('tapmartUser', JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('tapmartToken')
    localStorage.removeItem('tapmartUser')
    setUser(null)
  }

  const completeLogin = (userData) => {
    localStorage.setItem('tapmartToken', userData.token)
    localStorage.setItem('tapmartUser', JSON.stringify(userData))
    setUser(userData)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, completeLogin }}>
      {children}
    </AuthContext.Provider>
  )
}


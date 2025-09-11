import React, { createContext, useContext, useState } from 'react'
import jwtDecode from 'jwt-decode'


const API = import.meta.env.VITE_API_BASE || ''


const AuthContext = createContext(null)


export function AuthProvider({ children }) {
const [token, setToken] = useState(localStorage.getItem('access_token'))
const [user, setUser] = useState(token ? jwtDecode(token) : null)


const login = async (username, password) => {
// Hook to real login endpoint. For demo you can call backend /auth/login
const res = await fetch(`${API}/api/auth/login`, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username, password })
})
if (!res.ok) throw new Error('Login failed')
const data = await res.json()
const t = data.accessToken || data.token
localStorage.setItem('access_token', t)
setToken(t)
setUser(jwtDecode(t))
}


const logout = () => {
localStorage.removeItem('access_token')
setToken(null)
setUser(null)
}


return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
}


export const useAuth = () => useContext(AuthContext)
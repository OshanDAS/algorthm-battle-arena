import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'


export default function Login(){
const [user, setUser] = useState('player1')
const [pass, setPass] = useState('password')
const [err, setErr] = useState(null)
const auth = useAuth()
const nav = useNavigate()


const submit = async (e) => {
e.preventDefault()
try {
await auth.login(user, pass)
nav('/lobby')
} catch (e) { setErr(e.message) }
}


return (
<div className="app-container">
<div className="header"><h2>Login</h2></div>
<form onSubmit={submit} style={{display:'grid',gap:10}}>
<input className="input" value={user} onChange={e=>setUser(e.target.value)} />
<input className="input" value={pass} onChange={e=>setPass(e.target.value)} type="password" />
<div style={{display:'flex',gap:8}}>
<button className="button" type="submit">Sign in</button>
</div>
{err && <div style={{color:'red'}}>{err}</div>}
</form>
</div>
)
}
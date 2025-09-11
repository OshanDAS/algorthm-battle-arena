import React, { useEffect, useState } from 'react'


// Example static lobbies; replace with API call if needed
const DEMO_LOBBIES = [ { id: 'arena-1', name: 'Arena 1' }, { id: 'arena-2', name: 'Arena 2' } ]


export default function LobbyPage(){
const { logout } = useAuth()
const nav = useNavigate()
const [selected, setSelected] = useState(null)
const [messages, setMessages] = useState([])
const [latency, setLatency] = useState(null)


const onMatchStarted = (payload) => {
// payload: { matchId, problemId, startAt, durationSec }
// navigate to /match with payload
nav('/match', { state: { match: payload } })
}


const { joinLobby, leaveLobby, sendPing, connected } = useMatchHub({ onMatchStarted, onError: e=>setMessages(m=>[...m, String(e)]) })


useEffect(()=>{
let t
if (connected) {
// measure latency repeatedly to get rough RTT
t = setInterval(async ()=>{
const res = await sendPing()
if (res) setLatency(res.rtt)
}, 5000)
}
return ()=>clearInterval(t)
}, [connected])


const handleJoin = async (lobby) => {
try {
await joinLobby(lobby.id)
setSelected(lobby.id)
setMessages(m=>[...m, `Joined ${lobby.name}`])
} catch (e) { setMessages(m=>[...m, 'Join failed: '+e.message]) }
}
const handleLeave = async (lobby) => {
try {
await leaveLobby(lobby.id)
setSelected(null)
setMessages(m=>[...m, `Left ${lobby.name}`])
} catch (e) { setMessages(m=>[...m, 'Leave failed: '+e.message]) }
}


return (
<div className="app-container">
<div className="header">
<h2>Lobby</h2>
<div>
<button className="button" onClick={()=>logout()}>Logout</button>
</div>
</div>


<div style={{marginBottom:12}}>SignalR: {connected ? 'connected' : 'disconnected'} {latency && `• RTT ${latency}ms`}</div>


<div className="lobby-list">
{DEMO_LOBBIES.map(l=> (
<div key={l.id} className="lobby-card">
<h4>{l.name}</h4>
<p>ID: {l.id}</p>
{selected===l.id ? (
<button className="button" onClick={()=>handleLeave(l)}>Leave</button>
) : (
<button className="button" onClick={()=>handleJoin(l)}>Join</button>
)}
</div>
))}
</div>


<div style={{marginTop:20}}>
<h3>Events</h3>
<div style={{display:'grid',gap:6}}>
{messages.length===0 && <div style={{color:'#666'}}>No events</div>}
{messages.map((m,i)=>(<div key={i} style={{fontSize:13}}>{m}</div>))}
</div>
</div>
</div>
)
}
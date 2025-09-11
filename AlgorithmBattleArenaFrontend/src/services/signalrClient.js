import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useAuth } from './auth.jsx'
import { useEffect, useRef, useState } from 'react'


const HUB_URL = (import.meta.env.VITE_API_BASE || '') + '/hubs/match'


export function useMatchHub({ onMatchStarted, onError }) {
const { token } = useAuth()
const connRef = useRef(null)
const [connected, setConnected] = useState(false)


useEffect(() => {
if (!token) return


const connection = new HubConnectionBuilder()
.withUrl(HUB_URL, {
accessTokenFactory: () => token
})
.configureLogging(LogLevel.Warning)
.withAutomaticReconnect()
.build()


connection.on('MatchStarted', payload => {
try { onMatchStarted && onMatchStarted(payload) } catch (e) { console.error(e) }
})


connection.onclose(err => { setConnected(false); if (err) console.error('hub closed', err) })


connection.start().then(() => { connRef.current = connection; setConnected(true) }).catch(err => {
console.error('SignalR start failed', err); onError && onError(err)
})


return () => {
connection.stop().catch(()=>{})
}
}, [token])


const joinLobby = async (lobbyId) => {
if (!connRef.current) throw new Error('not connected')
return connRef.current.invoke('JoinLobby', lobbyId)
}
const leaveLobby = async (lobbyId) => {
if (!connRef.current) throw new Error('not connected')
return connRef.current.invoke('LeaveLobby', lobbyId)
}
const sendPing = async () => {
if (!connRef.current) return null
const start = Date.now()
// This requires server to IMPLEMENT a Ping method returning server timestamp
try {
const serverTs = await connRef.current.invoke('Ping')
const rtt = Date.now() - start
return { serverTs, rtt }
} catch (e) { return null }
}


return { joinLobby, leaveLobby, sendPing, connected }
}
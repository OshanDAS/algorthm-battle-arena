import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'


function formatCountdown(ms){
if (ms<=0) return '00:00'
const s = Math.floor(ms/1000)
const m = Math.floor(s/60)
const sec = s%60
return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}


export default function MatchPage(){
const loc = useLocation()
const nav = useNavigate()
const payload = loc.state?.match
const [nowOffset, setNowOffset] = useState(0)
const [remaining, setRemaining] = useState(null)


useEffect(()=>{
if (!payload) { nav('/lobby'); return }


// Parse startAt (server should send ISO string in UTC). We'll compute difference between local clock and provided startAt
const serverStart = dayjs(payload.startAt)
const update = ()=>{
const now = dayjs()
const r = serverStart.diff(now)
setRemaining(r)
}
update()
const id = setInterval(update, 250)
return ()=>clearInterval(id)
}, [])


const humanStart = useMemo(()=> payload ? dayjs(payload.startAt).local().format('YYYY-MM-DD HH:mm:ss') : '', [payload])


return (
<div className="app-container">
<div className="header">
<h2>Match</h2>
<div><button className="button" onClick={()=>nav('/lobby')}>Back to lobby</button></div>
</div>


<div style={{display:'grid',gap:12}}>
<div><strong>Match:</strong> {payload?.matchId}</div>
<div><strong>Problem:</strong> {payload?.problemId}</div>
<div><strong>Start at (local):</strong> {humanStart}</div>
<div className="countdown">{remaining !== null ? formatCountdown(remaining) : '...'}</div>
{remaining<=0 && <div style={{color:'green'}}>Match started — go!</div>}
</div>
</div>
)
}
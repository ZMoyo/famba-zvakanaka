'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [loc, setLoc] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [type, setType] = useState('breakdown')
  const [desc, setDesc] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    fetch('/api/reports').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setReports(d) })
  },[])

  const getGPS=()=>{
    setMsg('Getting GPS...')
    navigator.geolocation.getCurrentPosition(p=>{
      setLoc({lat:p.coords.latitude,lng:p.coords.longitude})
      setMsg(`GPS OK: ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`)
    },e=>setMsg('GPS failed: '+e.message),{enableHighAccuracy:true})
  }

  const submit=async()=>{
    if(!loc){ setMsg('First tap Check my GPS'); return }
    setLoading(true)
    const res=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:loc.lat,lng:loc.lng,report_type:type,description:desc})})
    const data=await res.json()
    setLoading(false)
    if(res.ok){ setMsg('✅ SAVED! Famba Zvakanaka!'); setReports([data,...reports]); setDesc('') }
    else setMsg('Error: '+(data.error||'failed'))
  }

  return(
    <div style={{padding:16,maxWidth:500,margin:'0 auto',fontFamily:'sans-serif'}}>
      <h1 style={{fontSize:26,fontWeight:900}}>Famba Zvakanaka 🛣️</h1>
      <p>Harare - Bulawayo Road Safety</p>
      
      <button onClick={getGPS} style={{background:'black',color:'white',padding:'14px',width:'100%',borderRadius:12,marginTop:12,fontWeight:'bold',fontSize:16}}>📍 CHECK MY GPS</button>
      {msg && <div style={{background:'#eef',padding:8,marginTop:8,borderRadius:8}}>{msg}</div>}
      
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16}}>
        <button onClick={()=>setType('breakdown')} style={{padding:16,borderRadius:12,border:type==='breakdown'?'3px solid black':'1px solid #ccc',background:type==='breakdown'?'black':'white',color:type==='breakdown'?'white':'black'}}>🚌 Breakdown</button>
        <button onClick={()=>setType('stuck')} style={{padding:16,borderRadius:12,border:type==='stuck'?'3px solid black':'1px solid #ccc',background:type==='stuck'?'black':'white',color:type==='stuck'?'white':'black'}}>🚧 Stuck</button>
        <button onClick={()=>setType('truck')} style={{padding:16,borderRadius:12,border:type==='truck'?'3px solid black':'1px solid #ccc',background:type==='truck'?'black':'white',color:type==='truck'?'white':'black'}}>🚚 Truck</button>
        <button onClick={()=>setType('animal')} style={{padding:16,borderRadius:12,border:type==='animal'?'3px solid black':'1px solid #ccc',background:type==='animal'?'black':'white',color:type==='animal'?'white':'black'}}>🐄 Animal</button>
      </div>

      <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Bus stuck near Chegutu" style={{width:'100%',marginTop:12,padding:12,borderRadius:10,border:'1px solid #ccc',height:80}}></textarea>
      
      <button onClick={submit} disabled={loading} style={{background:'#16a34a',color:'white',padding:14,width:'100%',borderRadius:12,marginTop:10,fontWeight:'bold',fontSize:18}}>{loading?'SAVING...':'✅ SUBMIT REPORT'}</button>

      <h3 style={{marginTop:24}}>Recent Reports ({reports.length})</h3>
      {reports.length===0?<p>No reports yet - be first to report!</p>:reports.map((r:any)=><div key={r.id} style={{border:'1px solid #ddd',padding:10,borderRadius:10,marginTop:8}}><b>{r.report_type}</b> - {new Date(r.created_at).toLocaleString()}<br/>{r.description}<br/><small>{r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}</small></div>)}
    </div>
  )
}

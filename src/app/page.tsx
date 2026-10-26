'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  lat: number
  lng: number
  report_type: string
  description: string
  created_at: string
}

const TYPES = [
  { id: 'breakdown', label: 'Breakdown', icon: '🚌' },
  { id: 'stuck', label: 'Stuck', icon: '🚧' },
  { id: 'truck', label: 'Truck', icon: '🚚' },
  { id: 'animal', label: 'Animal', icon: '🐄' },
]

export default function Home() {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('breakdown')
  const [desc, setDesc] = useState('')
  const [msg, setMsg] = useState('')

  // Load reports
  useEffect(() => {
    fetch('/api/reports').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setReports(d) })
    // Realtime
    const ch = supabase.channel('reports-live').on('postgres_changes',{event:'INSERT',schema:'public',table:'reports'}, payload=>{
      setReports(prev=>[payload.new as Report, ...prev])
    }).subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  }, [])

  const getGPS = () => {
    setMsg('Getting GPS...')
    navigator.geolocation.getCurrentPosition(pos=>{
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setMsg(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
    }, err=> setMsg('GPS failed: '+err.message), { enableHighAccuracy: true })
  }

  const submitReport = async () => {
    if(!loc){ setMsg('First click Check my GPS'); return }
    setLoading(true)
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ lat: loc.lat, lng: loc.lng, report_type: type, description: desc })
    })
    const data = await res.json()
    setLoading(false)
    if(res.ok){ setMsg('✅ Report saved!'); setDesc(''); }
    else { setMsg('❌ Error: '+ (data.error||'failed')) }
  }

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Famba Zvakanaka 🛣️</h1>
      <p style={{ color: '#666' }}>Report road issues Harare-Bulawayo</p>

      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 12, marginTop: 12 }}>
        <button onClick={getGPS} style={{ background: 'black', color: 'white', padding: '10px 16px', borderRadius: 8, width: '100%' }}>
          📍 Check my GPS
        </button>
        {msg && <p style={{ marginTop: 8, fontSize: 14 }}>{msg}</p>}
        {loc && <p style={{ fontSize: 12, color: 'green' }}>Lat: {loc.lat} Lng: {loc.lng}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
        {TYPES.map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)} style={{ padding: 12, borderRadius: 10, border: type===t.id?'2px solid black':'1px solid #ddd', background: type===t.id?'#000':'white', color: type===t.id?'white':'black' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description (e.g. Bus stuck near Chegutu)" style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid #ddd', minHeight: 70 }} />

      <button onClick={submitReport} disabled={loading} style={{ marginTop: 12, background: '#16a34a', color: 'white', padding: 12, borderRadius: 10, width: '100%', fontWeight: 700 }}>
        {loading?'Saving...':'Submit Report'}
      </button>

      <h2 style={{ marginTop: 24, fontWeight: 700 }}>Recent Reports ({reports.length})</h2>
      {reports.length===0 ? <p style={{ color: '#888' }}>No reports to show yet - be the first!</p> : reports.map(r=>(
        <div key={r.id} style={{ border: '1px solid #eee', padding: 10, borderRadius: 10, marginTop: 8 }}>
          <b>{r.report_type}</b> <span style={{ fontSize: 12, color: '#666' }}>{new Date(r.created_at).toLocaleString()}</span>
          <p style={{ fontSize: 14, margin: '4px 0' }}>{r.description}</p>
          <p style={{ fontSize: 11, color: '#888' }}>{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
        </div>
      ))}
    </main>
  )
}

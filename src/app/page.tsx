'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [loc, setLoc] = useState<{lat:number,lng:number,road?:string} | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Load reports
  useEffect(() => {
    fetch('/api/reports').then(r=>r.json()).then(setReports)
    // Realtime
    const ch = supabase.channel('reports').on('postgres_changes',{event:'INSERT',schema:'public',table:'reports'}, (payload)=>{
      setReports(prev=>[payload.new, ...prev])
    }).subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  }, [])

  const checkGPS = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      // Reverse geocode road name
      let road = 'Unknown Road'
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        const json = await res.json()
        road = json.display_name?.split(',')[0] || json.address?.road || road
      } catch {}
      setLoc({lat,lng,road})
      setLoading(false)
    }, ()=>{ alert('Allow location permission'); setLoading(false) })
  }

  const submitReport = async (type:string) => {
    if(!loc) return alert('Click Check my GPS first')
    const { data } = await supabase.from('reports').insert({
      type, lat: loc.lat, lng: loc.lng, road_name: loc.road
    }).select().single()
    if(data) setReports([data, ...reports])
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <button onClick={checkGPS} className="bg-green-600 text-white p-3 rounded w-full">
        {loading ? 'Checking...' : loc ? `Your location: ${loc.road} • Now` : 'Check my GPS'}
      </button>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={()=>submitReport('bus_breakdown')} className="border p-3 rounded">🚌 Breakdown</button>
        <button onClick={()=>submitReport('congestion_stuck')} className="border p-3 rounded">🚧 Stuck</button>
        <button onClick={()=>submitReport('truck')} className="border p-3 rounded">🚚 Truck</button>
        <button onClick={()=>submitReport('animal')} className="border p-3 rounded">🐄 Animal</button>
      </div>

      <h2 className="mt-6 font-bold">Recent Reports ({reports.length})</h2>
      {reports.length===0 ? <p>No reports to show yet</p> : reports.map(r=>(
        <div key={r.id} className="border-b py-2 text-sm">
          <b>{r.type}</b> - {r.road_name} - {new Date(r.created_at).toLocaleTimeString()}
        </div>
      ))}
    </div>
  )
        }

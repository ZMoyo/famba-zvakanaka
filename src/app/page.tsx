// fix supabase path
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const ZIMBABWE_PROVINCES: Record<string, { lat: [number, number], lng: [number, number] }> = {
  'Harare': { lat: [-17.5, -18.2], lng: [30.8, 31.4] },
  'Bulawayo': { lat: [-20.0, -20.7], lng: [28.3, 29.1] },
  'Manicaland': { lat: [-18.0, -20.5], lng: [31.5, 33.5] },
  'Mashonaland Central': { lat: [-16.0, -17.5], lng: [30.5, 32.0] },
  'Mashonaland East': { lat: [-17.5, -19.0], lng: [31.0, 32.5] },
  'Mashonaland West': { lat: [-16.5, -18.5], lng: [29.0, 31.0] },
  'Masvingo': { lat: [-19.5, -21.5], lng: [30.0, 32.5] },
  'Matabeleland North': { lat: [-18.0, -20.0], lng: [27.0, 29.5] },
  'Matabeleland South': { lat: [-20.5, -22.5], lng: [27.5, 30.0] },
  'Midlands': { lat: [-18.5, -20.5], lng: [29.0, 31.0] },
}

function getProvince(lat: number, lng: number) {
  for (const [prov, box] of Object.entries(ZIMBABWE_PROVINCES)) {
    if (lat >= box.lat[1] && lat <= box.lat[0] && lng >= box.lng[0] && lng <= box.lng[1]) return prov
  }
  return 'Harare'
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{lat:number,lng:number,province:string} | null>(null)
  const [status, setStatus] = useState('')
  const supabase = createClient()

  const getGPS = () => {
    setStatus('Getting GPS...')
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const province = getProvince(latitude, longitude)
      setLocation({ lat: latitude, lng: longitude, province })
      setStatus(`✅ Located in ${province}`)
    }, () => setStatus('❌ Enable GPS location'))
  }

  useEffect(() => { getGPS() }, [])

  const submitReport = async (e: any) => {
    e.preventDefault()
    if (!location) { setStatus('Get GPS first'); return }
    setLoading(true)
    const form = e.target
    const { error } = await supabase.from('reports').insert({
      description: form.description.value,
      category: form.category.value,
      latitude: location.lat,
      longitude: location.lng,
      province: location.province,
      status: 'pending'
    })
    setLoading(false)
    if (error) setStatus('Error: ' + error.message)
    else { setStatus('✅ Report sent from ' + location.province); form.reset() }
  }

  return (
    <main className="min-h-screen bg-green-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 mt-10">
        <h1 className="text-2xl font-bold text-green-700">Famba Zvakanaka 🇿🇼</h1>
        <p className="text-sm text-gray-600 mb-4">Nationwide Road Report — Auto GPS</p>
        
        <button onClick={getGPS} className="w-full bg-blue-600 text-white p-3 rounded-lg mb-3">
          📍 Get My Location (Nationwide)
        </button>
        {location && <p className="text-xs bg-gray-100 p-2 rounded mb-3">Lat: {location.lat.toFixed(4)} Lng: {location.lng.toFixed(4)}<br/>Province Auto: <b>{location.province}</b></p>}
        {status && <p className="text-sm mb-3">{status}</p>}

        <form onSubmit={submitReport} className="space-y-3">
          <select name="category" required className="w-full border p-3 rounded-lg">
            <option value="pothole">Pothole</option>
            <option value="damaged_road">Damaged Road</option>
            <option value="blocked">Blocked</option>
            <option value="accident">Accident</option>
          </select>
          <textarea name="description" required placeholder="Describe issue..." className="w-full border p-3 rounded-lg h-24" />
          <button disabled={loading} className="w-full bg-green-700 text-white p-3 rounded-lg font-bold">
            {loading ? 'Sending...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </main>
  )
}

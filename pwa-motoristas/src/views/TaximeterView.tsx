import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'

type TaximeterStatus = 'stopped' | 'running' | 'paused' | 'finished'

interface Category {
  id: string
  name: string
  fare_initial: number
  fare_per_km: number
  fare_per_min: number
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Carros', fare_initial: 5, fare_per_km: 2, fare_per_min: 0.2 },
  { id: '2', name: 'Carro Premium', fare_initial: 10, fare_per_km: 4, fare_per_min: 0.8 },
  { id: '3', name: 'Moto', fare_initial: 3, fare_per_km: 1.8, fare_per_min: 0.3 },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function TaximeterView() {
  const authStore = useAuthStore()
  const [status, setStatus] = useState<TaximeterStatus>('stopped')
  const [categories, setCategories] = useState(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState('1')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'ok' | 'error'>('ok')
  const [rideTimeSeconds, setRideTimeSeconds] = useState(0)
  const [totalDistance, setTotalDistance] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchRef = useRef<number | null>(null)
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const rideStartRef = useRef<number | null>(null)

  const currentCategory = categories.find((c) => c.id === selectedCategory) || categories[0]

  const totalFare = useMemo(() => {
    const distanceKm = totalDistance / 1000
    const timeMin = rideTimeSeconds / 60
    return currentCategory.fare_initial + distanceKm * currentCategory.fare_per_km + timeMin * currentCategory.fare_per_min
  }, [currentCategory, totalDistance, rideTimeSeconds])

  const formattedTime = useMemo(() => {
    const hours = Math.floor(rideTimeSeconds / 3600)
    const mins = Math.floor((rideTimeSeconds % 3600) / 60)
    const secs = rideTimeSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [rideTimeSeconds])

  useEffect(() => {
    if (!('geolocation' in navigator)) return

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        if (lastLocationRef.current && status === 'running') {
          const dist = haversine(lastLocationRef.current, next)
          setTotalDistance((d) => d + dist)
        }
        lastLocationRef.current = next
        setGpsStatus('ok')
        authStore.updateLocation(next.lat, next.lng)
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    )

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, authStore])

  function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371000
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLng = ((b.lng - a.lng) * Math.PI) / 180
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  }

  function startTimer() {
    rideStartRef.current = Date.now()
    timerRef.current = setInterval(() => {
      if (rideStartRef.current) {
        setRideTimeSeconds(Math.floor((Date.now() - rideStartRef.current) / 1000))
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  function startTaximeter() {
    setStatus('running')
    setTotalDistance(0)
    setRideTimeSeconds(0)
    startTimer()
    toast.success('Taxímetro iniciado!')
  }

  function pauseTaximeter() {
    setStatus('paused')
    stopTimer()
    toast.warning('Taxímetro pausado')
  }

  function resumeTaximeter() {
    setStatus('running')
    startTimer()
    toast.success('Taxímetro retomado')
  }

  function stopTaximeter() {
    setStatus('finished')
    stopTimer()
    toast.success('Corrida finalizada!')
  }

  function resetTaximeter() {
    setStatus('stopped')
    setTotalDistance(0)
    setRideTimeSeconds(0)
    rideStartRef.current = null
    toast.info('Pronto para nova corrida')
  }

  return (
    <div className="min-h-full bg-[#0d1117] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Taxímetro</h1>
        <span className={`rounded-full px-2 py-1 text-xs ${gpsStatus === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>
          GPS {gpsStatus === 'ok' ? 'OK' : 'AGUARDANDO'}
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-6 text-center">
        <p className="mb-2 text-xs uppercase tracking-widest text-gray-400">Valor atual</p>
        <p className="text-5xl font-bold text-green-400">{formatCurrency(totalFare)}</p>
        <p className="mt-4 font-mono text-3xl text-blue-400">{formattedTime}</p>
        <p className="mt-2 text-sm text-gray-400">Km {(totalDistance / 1000).toFixed(2)}</p>
      </div>

      <div className="mb-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
        <label className="mb-2 block text-xs uppercase text-gray-400">Categoria</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2"
          disabled={status !== 'stopped'}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3">
          <p className="text-gray-400">Valor Inicial</p>
          <p className="font-semibold">{currentCategory.fare_initial.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3">
          <p className="text-gray-400">Valor por Km</p>
          <p className="font-semibold">{currentCategory.fare_per_km.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3">
          <p className="text-gray-400">Valor por Min</p>
          <p className="font-semibold">{currentCategory.fare_per_min.toFixed(2)}</p>
        </div>
      </div>

      <label className="mb-4 flex items-center gap-2 rounded-xl border border-[#30363d] bg-[#161b22] p-4 text-sm">
        <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
        Reproduzir Voz
      </label>

      <div className="space-y-2">
        {status === 'stopped' && (
          <button type="button" onClick={startTaximeter} className="w-full rounded-xl bg-green-600 py-4 font-semibold">
            Iniciar Corrida
          </button>
        )}
        {status === 'running' && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={pauseTaximeter} className="rounded-xl bg-yellow-500 py-4 font-semibold text-black">
              Pausar
            </button>
            <button type="button" onClick={stopTaximeter} className="rounded-xl bg-red-600 py-4 font-semibold">
              Parar
            </button>
          </div>
        )}
        {status === 'paused' && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={resumeTaximeter} className="rounded-xl bg-green-600 py-4 font-semibold">
              Retomar
            </button>
            <button type="button" onClick={stopTaximeter} className="rounded-xl bg-red-600 py-4 font-semibold">
              Parar
            </button>
          </div>
        )}
        {status === 'finished' && (
          <button type="button" onClick={resetTaximeter} className="w-full rounded-xl bg-blue-600 py-4 font-semibold">
            Nova Corrida
          </button>
        )}
      </div>
    </div>
  )
}

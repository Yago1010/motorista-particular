import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, History, MapPin, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import {
  calcTaximeterFare,
  clearTaximeterTrips,
  loadTaximeterCategories,
  loadTaximeterTrips,
  saveTaximeterCategories,
  saveTaximeterTrip,
  type TaximeterCategory,
  type TaximeterTrip,
} from '@/utils/taximeterStorage'

type TaximeterStatus = 'stopped' | 'running' | 'paused' | 'finished'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export default function TaximeterView() {
  const authStore = useAuthStore()
  const [tab, setTab] = useState<'ride' | 'report'>('ride')
  const [status, setStatus] = useState<TaximeterStatus>('stopped')
  const [categories, setCategories] = useState<TaximeterCategory[]>(() => loadTaximeterCategories())
  const [selectedCategory, setSelectedCategory] = useState('2')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'ok' | 'error' | 'idle'>('idle')
  const [rideTimeSeconds, setRideTimeSeconds] = useState(0)
  const [totalDistance, setTotalDistance] = useState(0)
  const [trips, setTrips] = useState<TaximeterTrip[]>(() => loadTaximeterTrips())
  const [startedAt, setStartedAt] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchRef = useRef<number | null>(null)
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const rideStartRef = useRef<number | null>(null)
  const elapsedBeforePauseRef = useRef(0)
  const lastVoiceRef = useRef(0)

  const currentCategory = categories.find((c) => c.id === selectedCategory) || categories[0]
  const canEditTariffs = status === 'stopped'

  const totalFare = useMemo(
    () => calcTaximeterFare(currentCategory, totalDistance, rideTimeSeconds),
    [currentCategory, totalDistance, rideTimeSeconds]
  )

  const reportTotal = useMemo(() => trips.reduce((sum, t) => sum + t.fare, 0), [trips])

  const updateCategoryField = (field: keyof TaximeterCategory, value: string) => {
    if (!canEditTariffs) return
    const num = parseFloat(value.replace(',', '.'))
    if (Number.isNaN(num) || num < 0) return
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === selectedCategory ? { ...c, [field]: num } : c))
      saveTaximeterCategories(next)
      return next
    })
  }

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const tickTimer = useCallback(() => {
    if (!rideStartRef.current) return
    const elapsed =
      elapsedBeforePauseRef.current + Math.floor((Date.now() - rideStartRef.current) / 1000)
    setRideTimeSeconds(elapsed)
  }, [])

  const startTimer = useCallback(() => {
    rideStartRef.current = Date.now()
    stopTimer()
    timerRef.current = setInterval(tickTimer, 1000)
  }, [stopTimer, tickTimer])

  useEffect(() => {
    if (status !== 'running') return
    if (!('geolocation' in navigator)) {
      setGpsStatus('error')
      return
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        if (lastLocationRef.current) {
          const dist = haversine(lastLocationRef.current, next)
          if (dist > 2 && dist < 500) setTotalDistance((d) => d + dist)
        }
        lastLocationRef.current = next
        setGpsStatus('ok')
        authStore.updateLocation(next.lat, next.lng)
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
    )

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [status, authStore])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  useEffect(() => {
    if (!voiceEnabled || status !== 'running') return
    const now = Date.now()
    if (now - lastVoiceRef.current < 55000) return
    lastVoiceRef.current = now
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(`Valor atual ${totalFare.toFixed(2)} reais`)
      u.lang = 'pt-BR'
      window.speechSynthesis.speak(u)
    }
  }, [voiceEnabled, status, totalFare, rideTimeSeconds])

  function startTaximeter() {
    setStatus('running')
    setTotalDistance(0)
    setRideTimeSeconds(0)
    elapsedBeforePauseRef.current = 0
    lastLocationRef.current = null
    setStartedAt(new Date().toISOString())
    startTimer()
    toast.success('Corrida iniciada')
  }

  function pauseTaximeter() {
    elapsedBeforePauseRef.current = rideTimeSeconds
    stopTimer()
    rideStartRef.current = null
    setStatus('paused')
    toast.info('Taxímetro pausado')
  }

  function resumeTaximeter() {
    setStatus('running')
    startTimer()
    toast.success('Corrida retomada')
  }

  function stopTaximeter() {
    stopTimer()
    setStatus('finished')
    const finishedAt = new Date().toISOString()
    const trip: TaximeterTrip = {
      id: `${Date.now()}`,
      category_name: currentCategory.name,
      fare: totalFare,
      distance_m: totalDistance,
      duration_sec: rideTimeSeconds,
      started_at: startedAt || finishedAt,
      finished_at: finishedAt,
    }
    saveTaximeterTrip(trip)
    setTrips(loadTaximeterTrips())
    toast.success(`Corrida finalizada — ${formatCurrency(totalFare)}`)
  }

  function resetTaximeter() {
    stopTimer()
    setStatus('stopped')
    setTotalDistance(0)
    setRideTimeSeconds(0)
    elapsedBeforePauseRef.current = 0
    rideStartRef.current = null
    setStartedAt(null)
    setGpsStatus('idle')
  }

  function handleClearReport() {
    if (!window.confirm('Limpar todo o histórico de maçaneta?')) return
    clearTaximeterTrips()
    setTrips([])
    toast.success('Relatório limpo')
  }

  return (
    <div className="taximeter-page chama-shell-content">
      <div className="taximeter-tabs">
        <button
          type="button"
          className={`taximeter-tab${tab === 'ride' ? ' taximeter-tab--active' : ''}`}
          onClick={() => setTab('ride')}
        >
          <Gauge size={18} />
          Corrida
        </button>
        <button
          type="button"
          className={`taximeter-tab${tab === 'report' ? ' taximeter-tab--active' : ''}`}
          onClick={() => setTab('report')}
        >
          <History size={18} />
          Relatório
        </button>
      </div>

      {tab === 'ride' ? (
        <div className="taximeter-ride">
          <div className="taximeter-hero chama-card">
            <div className="taximeter-hero-top">
              <span className={`taximeter-gps taximeter-gps--${gpsStatus}`}>
                <MapPin size={14} />
                GPS {gpsStatus === 'ok' ? 'Ativo' : gpsStatus === 'error' ? 'Indisponível' : 'Aguardando'}
              </span>
              <span className={`taximeter-status taximeter-status--${status}`}>
                {status === 'stopped' && 'Pronto'}
                {status === 'running' && 'Em corrida'}
                {status === 'paused' && 'Pausado'}
                {status === 'finished' && 'Finalizado'}
              </span>
            </div>
            <p className="taximeter-label">Valor da corrida</p>
            <p className="taximeter-fare">{formatCurrency(totalFare)}</p>
            <p className="taximeter-clock">{formatTime(rideTimeSeconds)}</p>
            <p className="taximeter-meta">
              {(totalDistance / 1000).toFixed(2)} km · {currentCategory.name}
            </p>
          </div>

          <div className="chama-card taximeter-section">
            <p className="taximeter-section-title">Categoria</p>
            <div className="taximeter-categories">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  disabled={!canEditTariffs && cat.id !== selectedCategory}
                  className={`taximeter-cat${selectedCategory === cat.id ? ' taximeter-cat--active' : ''}`}
                  onClick={() => canEditTariffs && setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="chama-card taximeter-section">
            <p className="taximeter-section-title">Tarifas {canEditTariffs ? '(editável)' : ''}</p>
            <div className="taximeter-tariffs">
              <label className="taximeter-field">
                <span>Bandeirada (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="chama-input"
                  value={currentCategory.fare_initial}
                  disabled={!canEditTariffs}
                  onChange={(e) => updateCategoryField('fare_initial', e.target.value)}
                />
              </label>
              <label className="taximeter-field">
                <span>Por km (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="chama-input"
                  value={currentCategory.fare_per_km}
                  disabled={!canEditTariffs}
                  onChange={(e) => updateCategoryField('fare_per_km', e.target.value)}
                />
              </label>
              <label className="taximeter-field">
                <span>Por min (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="chama-input"
                  value={currentCategory.fare_per_min}
                  disabled={!canEditTariffs}
                  onChange={(e) => updateCategoryField('fare_per_min', e.target.value)}
                />
              </label>
            </div>
          </div>

          <label className="taximeter-voice chama-card">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            <Volume2 size={18} />
            Anunciar valor por voz (~1 min)
          </label>

          <div className="taximeter-actions">
            {status === 'stopped' && (
              <button type="button" className="chama-btn-primary taximeter-btn" onClick={startTaximeter}>
                <Play size={20} />
                Iniciar corrida
              </button>
            )}
            {status === 'running' && (
              <>
                <button type="button" className="taximeter-btn taximeter-btn--warn" onClick={pauseTaximeter}>
                  <Pause size={20} />
                  Pausar
                </button>
                <button type="button" className="taximeter-btn taximeter-btn--danger" onClick={stopTaximeter}>
                  <Square size={20} />
                  Finalizar
                </button>
              </>
            )}
            {status === 'paused' && (
              <>
                <button type="button" className="chama-btn-primary taximeter-btn" onClick={resumeTaximeter}>
                  <Play size={20} />
                  Retomar
                </button>
                <button type="button" className="taximeter-btn taximeter-btn--danger" onClick={stopTaximeter}>
                  <Square size={20} />
                  Finalizar
                </button>
              </>
            )}
            {status === 'finished' && (
              <button type="button" className="chama-btn-primary taximeter-btn" onClick={resetTaximeter}>
                <RotateCcw size={20} />
                Nova corrida
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="taximeter-report">
          <div className="chama-card taximeter-report-summary">
            <p className="taximeter-label">Total no período</p>
            <p className="taximeter-fare taximeter-fare--sm">{formatCurrency(reportTotal)}</p>
            <p className="taximeter-meta">{trips.length} corrida(s) registrada(s)</p>
          </div>

          {trips.length === 0 ? (
            <div className="chama-card taximeter-empty">
              <History size={32} className="taximeter-empty-icon" />
              <p>Nenhuma corrida de maçaneta ainda.</p>
              <p className="taximeter-meta">Finalize uma corrida na aba Corrida para ver aqui.</p>
            </div>
          ) : (
            <ul className="taximeter-trip-list">
              {trips.map((trip) => (
                <li key={trip.id} className="chama-card taximeter-trip-item">
                  <div>
                    <p className="taximeter-trip-cat">{trip.category_name}</p>
                    <p className="taximeter-meta">
                      {new Date(trip.finished_at).toLocaleString('pt-BR')} ·{' '}
                      {(trip.distance_m / 1000).toFixed(2)} km · {formatTime(trip.duration_sec)}
                    </p>
                  </div>
                  <p className="taximeter-trip-fare">{formatCurrency(trip.fare)}</p>
                </li>
              ))}
            </ul>
          )}

          {trips.length > 0 && (
            <button type="button" className="chama-btn-outline taximeter-clear" onClick={handleClearReport}>
              Limpar relatório
            </button>
          )}
        </div>
      )}
    </div>
  )
}

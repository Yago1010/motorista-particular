import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Pause, Play, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { useRidesStore } from '@/stores/rides'
import { useWalletStore } from '@/stores/wallet'
import DriverMapView, { type DriverMapViewRef } from '@/components/DriverMapView'
import BalanceBar from '@/components/BalanceBar'
import PromoBanner from '@/components/PromoBanner'
import RideRequestCard from '@/components/RideRequestCard'
import api from '@/services/api'

export default function HomeView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const ridesStore = useRidesStore()
  const walletStore = useWalletStore()
  const mapRef = useRef<DriverMapViewRef | null>(null)

  const [loading, setLoading] = useState(false)
  const [processingRide, setProcessingRide] = useState<string | number | null>(null)
  const [isOnline, setIsOnline] = useState(authStore.isOnline)
  const [isPaused, setIsPaused] = useState(false)
  const [activeRideIndex, setActiveRideIndex] = useState(0)

  const driverName = authStore.user
    ? `${authStore.user.first_name} ${authStore.user.last_name || ''}`.trim()
    : 'Motorista'

  const balance = walletStore.wallet?.balance ?? 245.8
  const pendingRides = ridesStore.pendingRides
  const activeRide = pendingRides[activeRideIndex] || pendingRides[0]

  useEffect(() => {
    refreshRides()
    loadWallet()

    if (!authStore.isOnline) {
      authStore.toggleOnline(true).then((result) => {
        if (result.success) setIsOnline(true)
      })
    }

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          authStore.updateLocation(position.coords.latitude, position.coords.longitude)
          mapRef.current?.setCenter(position.coords.latitude, position.coords.longitude, 16)
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  async function loadWallet() {
    try {
      const response = await api.get('/api/driver/wallet')
      walletStore.setWallet(response.data)
    } catch {
      walletStore.setWallet({
        balance: 245.8,
        pending_balance: 32.5,
        transactions: [],
      })
    }
  }

  async function refreshRides() {
    setLoading(true)
    await ridesStore.fetchPendingRides()
    setLoading(false)
  }

  async function toggleOnline() {
    const result = await authStore.toggleOnline(!isOnline)
    if (result.success) {
      setIsOnline(!isOnline)
      toast.success(!isOnline ? 'Você está online' : 'Você está offline')
    }
  }

  async function acceptRide(rideId: string | number) {
    setProcessingRide(rideId)
    const result = await ridesStore.acceptRide(rideId)
    if (result.success) {
      toast.success('Corrida aceita!')
      navigate(`/ride/${rideId}`)
    } else {
      toast.error(result.message || 'Erro ao aceitar corrida')
    }
    setProcessingRide(null)
  }

  async function declineRide(rideId: string | number) {
    setProcessingRide(rideId)
    await ridesStore.declineRide(rideId)
    toast.info('Corrida recusada')
    setProcessingRide(null)
    if (activeRideIndex >= pendingRides.length - 1) {
      setActiveRideIndex(Math.max(0, activeRideIndex - 1))
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <div className="relative h-56 shrink-0">
        <DriverMapView
          ref={mapRef}
          height="100%"
          width="100%"
          showUserLocation
          center={[-23.5505, -46.6333]}
          zoom={15}
        />

        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow">
            <span className="text-sm font-bold text-blue-600">
              {driverName.charAt(0).toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleOnline}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow ${
              isOnline ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isOnline ? 'Disponível' : 'Offline'}
          </button>

          <button
            type="button"
            onClick={toggleOnline}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold shadow"
          >
            GPS
          </button>
        </div>

        <div className="absolute inset-x-4 top-16 z-20">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md">
            <Search className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">
              {isPaused
                ? 'Você está em pausa'
                : isOnline
                  ? 'Estamos procurando rotas pra você'
                  : 'Fique online para receber corridas'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-6 flex-1 space-y-4 rounded-t-3xl bg-gray-50 px-4 pb-6 pt-5">
        <BalanceBar balance={balance} />

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Rotas pra entregar agora</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPaused((p) => !p)
                toast.info(isPaused ? 'Retomado' : 'Pausado')
              }}
              className="rounded-full border border-gray-200 bg-white p-2 text-gray-600"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={refreshRides}
              className="rounded-full border border-gray-200 bg-white p-2 text-gray-600"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <Link
          to="/trips"
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-800 shadow-sm"
        >
          <span>Vem conferir as Rotas Disponíveis</span>
          <span aria-hidden>›</span>
        </Link>

        <PromoBanner
          link="https://motoristaparticular.app.br"
          onCtaClick={() => toast.info('Promoção aberta')}
        />

        {activeRide && isOnline && !isPaused && (
          <RideRequestCard
            ride={activeRide}
            processing={processingRide === activeRide.id}
            onAccept={() => acceptRide(activeRide.id)}
            onDecline={() => declineRide(activeRide.id)}
            onMessage={() => navigate(`/chat/${activeRide.id}`)}
          />
        )}

        {!loading && pendingRides.length === 0 && isOnline && !isPaused && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="font-medium text-gray-700">Nenhuma corrida disponível</p>
            <p className="text-sm text-gray-500">Aguardando novas solicitações...</p>
          </div>
        )}
      </div>
    </div>
  )
}

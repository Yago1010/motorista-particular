import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Pause, Play, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import L from 'leaflet'
import { useAuthStore } from '@/stores/auth'
import { useRidesStore } from '@/stores/rides'
import { useWalletStore } from '@/stores/wallet'
import DriverMapView, { type DriverMapViewRef } from '@/components/DriverMapView'
import BalanceBar from '@/components/BalanceBar'
import PromoBanner from '@/components/PromoBanner'
import RideRequestCard from '@/components/RideRequestCard'
import { useAppBanners } from '@/hooks/useAppBanners'
import { usePendingRidesPolling } from '@/hooks/useRidePolling'
import { subscribeToPush } from '@/services/push'
import notificationService from '@/services/notifications'
import api from '@/services/api'
import LocationGate from '@/components/LocationGate'
import { CHAMA_LOGO_URL, CHAMA_APP_NAME } from '@/config/brand'
import { normalizeWalletTransaction } from '@/utils/walletTx'
import { startLiveLocationTracking, type GeoCoords } from '@/utils/geolocation'
import { isDemoDriverToken, updateDemoRide, getActiveDemoRide, purgeTerminalDemoRide } from '@/utils/demoRideBridge'

function driverLiveIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: '<div class="user-location-pulse"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function DriverHomeContent({ seedCoords }: { seedCoords?: GeoCoords | null }) {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const ridesStore = useRidesStore()
  const walletStore = useWalletStore()
  const mapRef = useRef<DriverMapViewRef | null>(null)
  const locationErrorRef = useRef(false)
  const seedAppliedRef = useRef(false)

  const [refreshing, setRefreshing] = useState(false)
  const [processingRide, setProcessingRide] = useState<string | number | null>(null)
  const [activeRideIndex, setActiveRideIndex] = useState(0)
  const [driverPos, setDriverPos] = useState<[number, number] | null>(
    seedCoords ? [seedCoords.lat, seedCoords.lng] : null
  )

  const isOnline = authStore.isOnline
  const isPaused = authStore.isPaused
  const balance = walletStore.wallet?.balance ?? 0
  const pendingRides = ridesStore.pendingRides
  const activeRide = pendingRides[activeRideIndex] || pendingRides[0]
  const { banner } = useAppBanners('driver', 'home')

  usePendingRidesPolling(isOnline && !isPaused, 5000)

  useEffect(() => {
    purgeTerminalDemoRide()
    useRidesStore.setState({ currentRide: null })
    ridesStore.fetchPendingRides()
    loadWallet()
    notificationService.init()
    subscribeToPush().then((ok) => {
      if (ok) toast.success('Notificações push ativadas')
    })
    if (!authStore.isOnline) authStore.toggleOnline(true)
  }, [])

  useEffect(() => {
    if (seedCoords && !seedAppliedRef.current) {
      seedAppliedRef.current = true
      setDriverPos([seedCoords.lat, seedCoords.lng])
      mapRef.current?.setCenter(seedCoords.lat, seedCoords.lng, 16)
    }
  }, [seedCoords])

  useEffect(() => {
    const stop = startLiveLocationTracking(
      (coords) => {
        setDriverPos([coords.lat, coords.lng])
        mapRef.current?.setCenter(coords.lat, coords.lng)
        if (isDemoDriverToken(authStore.token)) {
          const demo = getActiveDemoRide()
          if (demo && !['searching', 'completed', 'cancelled'].includes(demo.status || '')) {
            updateDemoRide({ driver_lat: coords.lat, driver_lng: coords.lng })
          }
        } else {
          void authStore.updateLocation(coords.lat, coords.lng)
        }
      },
      () => {
        if (locationErrorRef.current) return
        locationErrorRef.current = true
        toast.error('Ative a localização para receber corridas')
      }
    )
    return stop
  }, [authStore])

  async function loadWallet() {
    try {
      const response = await api.get('driver/wallet')
      const data = response.data
      walletStore.setWallet({
        ...data,
        transactions: (data.transactions || []).map(normalizeWalletTransaction),
      })
    } catch {
      walletStore.setWallet({ balance: 0, pending_balance: 0, transactions: [] })
    }
  }

  async function refreshRides() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await ridesStore.fetchPendingRides()
    } finally {
      setRefreshing(false)
    }
  }

  async function toggleOnlineStatus() {
    if (isOnline) {
      await authStore.toggleOnline(false)
      if (isPaused) await authStore.togglePause(false)
      toast.info('Você está offline')
      return
    }
    await authStore.toggleOnline(true)
    toast.success('Você está online')
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
  }

  const mapMarkers = driverPos
    ? [{ id: 'driver', position: driverPos, popup: 'Você', icon: driverLiveIcon() }]
    : []

  return (
    <div className="driver-home flex min-h-full flex-col">
      <div className="driver-home-map relative h-56 shrink-0">
        <DriverMapView
          ref={mapRef}
          height="100%"
          width="100%"
          center={driverPos ?? [-23.5505, -46.6333]}
          zoom={15}
          markers={mapMarkers}
        />
        <div className="absolute inset-x-4 top-3 z-20">
          <div className="driver-search-pill">
            <Search className="h-4 w-4 shrink-0" />
            <span>
              {!isOnline ? 'Offline' : driverPos ? 'GPS ativo' : 'Obtendo localização...'}
            </span>
          </div>
        </div>
      </div>

      <div className="driver-home-panel relative z-10 -mt-6 flex-1 space-y-4 px-4 pb-28 pt-5">
        <BalanceBar balance={balance} />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#06220f]">Corridas disponíveis</h2>
          <div className="flex gap-2">
            <button type="button" onClick={toggleOnlineStatus} className="rounded-full border bg-white p-2">
              {isOnline ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button type="button" onClick={refreshRides} disabled={refreshing} className="rounded-full border bg-white p-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {activeRide && isOnline && !isPaused && (
          <RideRequestCard
            ride={activeRide}
            processing={processingRide === activeRide.id}
            onAccept={() => acceptRide(activeRide.id)}
            onDecline={() => declineRide(activeRide.id)}
            onMessage={() => navigate(`/chat/${activeRide.id}`)}
          />
        )}

        {!refreshing && pendingRides.length === 0 && isOnline && !isPaused && (
          <div className="rounded-2xl border border-dashed bg-white p-6 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="font-medium">Nenhuma corrida disponível</p>
            <p className="text-sm text-gray-500">Aguardando solicitações...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomeView() {
  const [seedCoords, setSeedCoords] = useState<GeoCoords | null>(null)
  const welcomeRef = useRef(false)

  const onGranted = useCallback((coords?: GeoCoords) => {
    if (coords) setSeedCoords(coords)
    if (!welcomeRef.current) {
      welcomeRef.current = true
      toast.success('Localização ativada!')
    }
  }, [])

  return (
    <LocationGate logoUrl={CHAMA_LOGO_URL} appName={CHAMA_APP_NAME} onGranted={onGranted}>
      <DriverHomeContent seedCoords={seedCoords} />
    </LocationGate>
  )
}

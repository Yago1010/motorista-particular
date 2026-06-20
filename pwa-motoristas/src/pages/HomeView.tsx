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
import { useAppBanners } from '@/hooks/useAppBanners'
import { usePendingRidesPolling } from '@/hooks/useRidePolling'
import { subscribeToPush } from '@/services/push'
import notificationService from '@/services/notifications'
import api from '@/services/api'
import LocationGate from '@/components/LocationGate'
import { CHAMA_LOGO_URL, CHAMA_APP_NAME } from '@/config/brand'
import { normalizeWalletTransaction } from '@/utils/walletTx'
import { startLiveLocationTracking } from '@/utils/geolocation'

export default function HomeView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const ridesStore = useRidesStore()
  const walletStore = useWalletStore()
  const mapRef = useRef<DriverMapViewRef | null>(null)

  const [refreshing, setRefreshing] = useState(false)
  const [processingRide, setProcessingRide] = useState<string | number | null>(null)
  const [activeRideIndex, setActiveRideIndex] = useState(0)
  const [mapVisible, setMapVisible] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)

  const isOnline = authStore.isOnline
  const isPaused = authStore.isPaused

  const balance = walletStore.wallet?.balance ?? 0
  const pendingRides = ridesStore.pendingRides
  const activeRide = pendingRides[activeRideIndex] || pendingRides[0]
  const { banner } = useAppBanners('driver', 'home')

  usePendingRidesPolling(isOnline && !isPaused, 5000)

  useEffect(() => {
    ridesStore.fetchPendingRides()
    loadWallet()
    notificationService.init()
    subscribeToPush().then((ok) => {
      if (ok) toast.success('Notificações push ativadas')
    })

    if (!authStore.isOnline) {
      authStore.toggleOnline(true)
    }

    const stopTracking = startLiveLocationTracking(
      (coords) => {
        setMapCenter([coords.lat, coords.lng])
        mapRef.current?.setCenter(coords.lat, coords.lng, 16)
        authStore.updateLocation(coords.lat, coords.lng)
      },
      () => toast.error('Ative a localização para receber corridas')
    )

    return () => stopTracking()
  }, [])

  async function loadWallet() {
    try {
      const response = await api.get('driver/wallet')
      const data = response.data
      walletStore.setWallet({
        ...data,
        transactions: (data.transactions || []).map(normalizeWalletTransaction),
      })
    } catch {
      walletStore.setWallet({
        balance: 0,
        pending_balance: 0,
        transactions: [],
      })
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
      toast.info('Você está offline — não receberá corridas')
      return
    }
    await authStore.toggleOnline(true)
    if (isPaused) await authStore.togglePause(false)
    toast.success('Você está online — aguardando corridas')
  }

  async function acceptRide(rideId: string | number) {
    setProcessingRide(rideId)
    const result = await ridesStore.acceptRide(rideId)
    if (result.success) {
      setMapVisible(false)
      toast.success('Corrida aceita!')
      window.setTimeout(() => navigate(`/ride/${rideId}`), 150)
    } else {
      toast.error(result.message || 'Erro ao aceitar corrida')
      setProcessingRide(null)
    }
  }

  const walletBlocked = balance < 0

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
    <LocationGate
      logoUrl={CHAMA_LOGO_URL}
      appName={CHAMA_APP_NAME}
      onGranted={() => toast.success('Localização ativada!')}
    >
    <div className="driver-home flex min-h-full flex-col">
      <div className="driver-home-map relative h-56 shrink-0">
        {mapVisible && (
        <DriverMapView
          ref={mapRef}
          height="100%"
          width="100%"
          showUserLocation
          center={mapCenter ?? [-23.5505, -46.6333]}
          zoom={15}
        />
        )}

        <div className="absolute inset-x-4 top-3 z-20">
          <div className="driver-search-pill">
            <Search className="h-4 w-4 shrink-0" />
            <span>
              {!isOnline
                ? 'Você está offline'
                : isPaused
                  ? 'Você está em pausa'
                  : 'Estamos procurando rotas pra você'}
            </span>
          </div>
        </div>
      </div>

      <div className="driver-home-panel relative z-10 -mt-6 flex-1 space-y-4 px-4 pb-28 pt-5">
        <BalanceBar balance={balance} />

        {walletBlocked && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Carteira bloqueada: saldo negativo. Recarregue para aceitar novas corridas.
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#06220f]">Rotas pra entregar agora</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleOnlineStatus}
              className="rounded-full border border-gray-200 bg-white p-2 text-gray-600"
              title={isOnline ? 'Ficar offline' : 'Ficar online'}
            >
              {isOnline ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={refreshRides}
              disabled={refreshing}
              className="rounded-full border border-gray-200 bg-white p-2 text-gray-600"
              title="Atualizar corridas"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
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

        {banner ? (
          <PromoBanner
            title={banner.title}
            subtitle={banner.subtitle}
            description={banner.description}
            ctaLabel={banner.cta_label || 'Saiba mais'}
            link={banner.link_url}
            imageUrl={banner.image_url}
          />
        ) : null}

        {activeRide && isOnline && !isPaused && !walletBlocked && (
          <RideRequestCard
            ride={activeRide}
            processing={processingRide === activeRide.id}
            onAccept={() => acceptRide(activeRide.id)}
            onDecline={() => declineRide(activeRide.id)}
            onMessage={() => navigate(`/chat/${activeRide.id}`)}
          />
        )}

        {!refreshing && pendingRides.length === 0 && isOnline && !isPaused && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="font-medium text-gray-700">Nenhuma corrida disponível</p>
            <p className="text-sm text-gray-500">Aguardando novas solicitações...</p>
          </div>
        )}
      </div>
    </div>
    </LocationGate>
  )
}

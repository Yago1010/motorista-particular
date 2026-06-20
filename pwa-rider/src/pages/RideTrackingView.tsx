import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Star } from 'lucide-react'
import L from 'leaflet'
import { toast } from 'sonner'
import { useRidesStore } from '@/stores/rides'
import RiderMapView from '@/components/RiderMapView'
import LoadingOverlay from '@/components/LoadingOverlay'
import DriverAssignedModal from '@/components/DriverAssignedModal'
import { useRideQuery, useDriverLocationQuery } from '@/hooks/queries/useRideQueries'
import { fetchOsrmRoute, formatDistance, formatDuration } from '@/utils/navigation'
import { isDemoModeEnabled, useDemoRideSimulation } from '@/hooks/useDemoRideSimulation'

function driverMarkerIcon() {
  return L.divIcon({
    className: 'driver-car-marker',
    html: `<div style="background:#39ff6a;color:#031105;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.4);transform:translateZ(0)">🚗</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function pickupMarkerIcon() {
  return L.divIcon({
    className: 'pickup-marker',
    html: `<div style="background:#39ff6a;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function destinationMarkerIcon() {
  return L.divIcon({
    className: 'dest-marker',
    html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function RideTrackingView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ridesStore = useRidesStore()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [tripRoute, setTripRoute] = useState<[number, number][]>([])
  const [approachRoute, setApproachRoute] = useState<[number, number][]>([])
  const [osrmEta, setOsrmEta] = useState<{ distance: number; duration: number } | null>(null)

  const [showDriverModal, setShowDriverModal] = useState(false)
  const [driverModalSeen, setDriverModalSeen] = useState(false)

  const { data: ride, isLoading } = useRideQuery(id)
  const demoEnabled = isDemoModeEnabled()
  const demoSim = useDemoRideSimulation(ride, demoEnabled)
  const displayRide = demoSim.ride ?? ride
  const hasDriver = !!displayRide?.driver && !['searching', 'cancelled'].includes(displayRide?.status || '')
  const { data: driverLoc } = useDriverLocationQuery(id, hasDriver && !demoSim.driverLocation)

  useEffect(() => {
    if (displayRide) ridesStore.setCurrentRide(displayRide)
  }, [displayRide])

  useEffect(() => {
    if (displayRide?.status === 'accepted' && displayRide.driver && !driverModalSeen) {
      setShowDriverModal(true)
      setDriverModalSeen(true)
    }
  }, [displayRide?.status, displayRide?.driver, driverModalSeen])

  useEffect(() => {
    if (demoSim.driverLocation) {
      ridesStore.setDriverLocation(demoSim.driverLocation.lat, demoSim.driverLocation.lng)
    } else if (driverLoc) {
      ridesStore.setDriverLocation(driverLoc.lat, driverLoc.lng)
    } else if (displayRide?.driver && (displayRide as any).driver_lat) {
      ridesStore.setDriverLocation((displayRide as any).driver_lat, (displayRide as any).driver_lng)
    }
  }, [driverLoc, displayRide, demoSim.driverLocation])

  useEffect(() => {
    const r = displayRide
    if (r?.status === 'completed' && !(r as any).is_paid) {
      navigate(`/ride/${id}/payment`, { replace: true })
    }
  }, [displayRide?.status, (displayRide as any)?.is_paid, id, navigate])

  const driverLocation = demoSim.driverLocation || driverLoc || ridesStore.driverLocation
  const isSearching = displayRide?.status === 'searching'
  const isEnRoute = ['accepted', 'arrived', 'pickup_arrived'].includes(displayRide?.status || '')
  const isInProgress = ['started', 'in_progress'].includes(displayRide?.status || '')

  useEffect(() => {
    if (!displayRide?.origin_lat || !displayRide?.origin_lng || !displayRide?.dest_lat || !displayRide?.dest_lng) return
    fetchOsrmRoute(displayRide.origin_lat, displayRide.origin_lng, displayRide.dest_lat, displayRide.dest_lng).then((result) => {
      if (result) setTripRoute(result.points)
    })
  }, [displayRide?.id, displayRide?.origin_lat, displayRide?.dest_lat])

  useEffect(() => {
    if (!driverLocation || displayRide?.origin_lat == null || displayRide?.origin_lng == null) return
    const destLat = isInProgress ? (displayRide.dest_lat ?? displayRide.origin_lat) : displayRide.origin_lat
    const destLng = isInProgress ? (displayRide.dest_lng ?? displayRide.origin_lng) : displayRide.origin_lng
    if (!isEnRoute && !isInProgress) {
      setApproachRoute([])
      setOsrmEta(null)
      return
    }
    fetchOsrmRoute(driverLocation.lat, driverLocation.lng, destLat, destLng).then((result) => {
      if (result) {
        setApproachRoute(result.points)
        setOsrmEta({ distance: result.distance, duration: result.duration })
      }
    })
  }, [driverLocation?.lat, driverLocation?.lng, isEnRoute, isInProgress, displayRide?.origin_lat, displayRide?.dest_lat])

  const eta = useMemo(() => {
    if (driverLoc?.time && driverLoc?.distance) {
      const distM = typeof driverLoc.distance === 'string'
        ? parseFloat(driverLoc.distance) * 1000
        : Number(driverLoc.distance)
      return { distance: distM || osrmEta?.distance || 0, duration: (driverLoc.time || 0) * 60 }
    }
    return osrmEta
  }, [driverLoc, osrmEta])

  const mapCenter = useMemo<[number, number]>(() => {
    if (driverLocation) return [driverLocation.lat, driverLocation.lng]
    if (displayRide?.origin_lat && displayRide?.origin_lng) return [displayRide.origin_lat, displayRide.origin_lng]
    return [-23.5505, -46.6333]
  }, [displayRide, driverLocation])

  const mapMarkers = useMemo(() => {
    const markers = []
    if (displayRide?.origin_lat && displayRide?.origin_lng) {
      markers.push({
        id: 'pickup',
        position: [displayRide.origin_lat, displayRide.origin_lng] as [number, number],
        popup: 'Embarque',
        icon: pickupMarkerIcon(),
      })
    }
    if (displayRide?.dest_lat && displayRide?.dest_lng) {
      markers.push({
        id: 'destination',
        position: [displayRide.dest_lat, displayRide.dest_lng] as [number, number],
        popup: 'Destino',
        icon: destinationMarkerIcon(),
      })
    }
    if (driverLocation && displayRide?.driver) {
      markers.push({
        id: 'driver',
        position: [driverLocation.lat, driverLocation.lng] as [number, number],
        popup: `${displayRide.driver.first_name} • ${displayRide.driver.vehicle_model || 'Veículo'}`,
        icon: driverMarkerIcon(),
        animated: true,
      })
    }
    return markers
  }, [displayRide, driverLocation])

  const polylines = useMemo(() => {
    const lines = []
    if (tripRoute.length) {
      lines.push({
        points: tripRoute,
        color: isInProgress ? '#64748b' : '#334155',
        weight: 4,
        dashed: true,
      })
    }
    if (approachRoute.length && (isEnRoute || isInProgress)) {
      lines.push({ points: approachRoute, color: '#39ff6a', weight: 6, dashed: false })
    }
    return lines
  }, [tripRoute, approachRoute, isEnRoute, isInProgress])

  const cancelRide = async () => {
    if (!id || !ride) return
    if (['accepted', 'started', 'in_progress', 'arrived', 'pickup_arrived'].includes(ride.status)) {
      if (!window.confirm('Cancelar agora pode gerar taxa. Deseja continuar?')) return
    }
    const result = await ridesStore.cancelRide(id, 'Cancelado pelo passageiro')
    if (result.success) {
      toast.info('Corrida cancelada')
      navigate('/')
    }
  }

  const submitRating = async () => {
    if (!id || rating === 0) return
    const result = await ridesStore.rateDriver(id, rating, comment)
    if (result.success) {
      toast.success('Avaliação enviada!')
      navigate('/')
    } else {
      toast.error(result.message || 'Erro ao avaliar')
    }
  }

  if (isLoading && !ride && !displayRide) return <LoadingOverlay message="Carregando corrida..." />

  if (!displayRide) {
    return (
      <div className="chama-page flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <p>Corrida não encontrada</p>
        <button type="button" onClick={() => navigate('/')} className="chama-btn-primary px-4 py-2">
          Voltar
        </button>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    searching: 'Procurando motorista...',
    accepted: 'Motorista a caminho do embarque',
    in_progress: 'Indo para o destino',
    started: 'Indo para o destino',
    arrived: 'Motorista chegou',
    pickup_arrived: 'Motorista no local — embarque',
    destination_arrived: 'Chegou no destino — aguardando pagamento',
    completed: 'Corrida finalizada',
    cancelled: 'Cancelada',
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="chama-page relative flex min-h-screen flex-col">
      {showDriverModal && displayRide?.driver && (
        <DriverAssignedModal
          ride={displayRide}
          onClose={() => setShowDriverModal(false)}
          onCancel={cancelRide}
        />
      )}
      <div className="absolute inset-0 bottom-48">
        <RiderMapView
          height="100%"
          width="100%"
          center={mapCenter}
          zoom={15}
          markers={mapMarkers}
          polyline={polylines}
          autoFit
          fitPadding={[48, 48]}
        />
        <button type="button" onClick={() => navigate('/')} className="chama-map-back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {eta && displayRide.driver && (isEnRoute || isInProgress) && (
          <div className="chama-eta-badge">
            {isInProgress ? '🎯 Destino em' : '🚗 Chega em'}{' '}
            <span>{formatDuration(eta.duration)}</span> • {formatDistance(eta.distance)}
          </div>
        )}
      </div>

      <div className="chama-bottom-sheet">
        {isSearching ? (
          <div className="flex flex-col items-center px-6 py-8">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#39ff6a]/30 border-t-[#39ff6a]" />
            <h2 className="text-lg font-bold">Buscando motorista...</h2>
            <p className="mt-3 text-sm font-medium text-[#39ff6a]">
              {formatCurrency(displayRide.estimated_fare || displayRide.fare || 0)} • {displayRide.payment_method || 'cash'}
            </p>
            {demoEnabled && (
              <p className="mt-2 text-xs text-gray-400">Modo demo: motorista simulado em instantes</p>
            )}
            <button type="button" onClick={cancelRide} className="chama-btn-outline mt-6 w-full text-red-400">
              Cancelar busca
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-4 pb-8">
            <p className="text-lg font-bold">{statusLabel[displayRide.status] || displayRide.status}</p>

            {displayRide.driver && (
              <div className="chama-card flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#39ff6a] text-xl font-bold text-[#031105]">
                  {displayRide.driver.first_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{displayRide.driver.first_name} {displayRide.driver.last_name}</p>
                  <p className="text-sm text-gray-400">{displayRide.driver.vehicle_model} • {displayRide.driver.vehicle_plate}</p>
                </div>
                <Link to={`/chat/${displayRide.id}`} className="chama-btn-icon">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </div>
            )}

            <div className="chama-card p-4">
              <p className="text-xs text-gray-400">Embarque</p>
              <p className="text-sm">{displayRide.origin_address || displayRide.pickup_address}</p>
              <p className="mt-2 text-xs text-gray-400">Destino</p>
              <p className="text-sm">{displayRide.destination_address}</p>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
                <span className="text-lg font-bold text-[#39ff6a]">
                  {formatCurrency(displayRide.fare || displayRide.estimated_fare || 0)}
                </span>
                <span className="text-sm capitalize">{displayRide.payment_method}</span>
              </div>
            </div>

            {displayRide.status === 'completed' && (displayRide as any).is_paid && (
              <div className="chama-card p-4">
                <p className="mb-2 font-semibold">Avalie o motorista</p>
                <div className="mb-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)}>
                      <Star className={`h-7 w-7 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comentário (opcional)"
                  className="chama-input mb-3 w-full"
                  rows={2}
                />
                <button type="button" onClick={submitRating} disabled={rating === 0} className="chama-btn-primary w-full">
                  Enviar avaliação
                </button>
              </div>
            )}

            {!['completed', 'cancelled', 'searching'].includes(displayRide.status) && (
              <button type="button" onClick={cancelRide} className="chama-btn-outline w-full text-red-400">
                Cancelar corrida
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageCircle, Navigation, Star } from 'lucide-react'
import { useRidesStore, type Ride } from '@/stores/rides'
import { useRidePolling } from '@/hooks/useRidePolling'
import DriverMapView from '@/components/DriverMapView'
import { pickupMarkerIcon, destinationMarkerIcon } from '@/utils/mapIcons'
import { openGoogleMapsNavigation, openWazeNavigation } from '@/utils/navigation'
import { startLiveLocationTracking } from '@/utils/geolocation'
import { useAuthStore } from '@/stores/auth'
import { isDemoRideId, updateDemoRide, purgeTerminalDemoRide } from '@/utils/demoRideBridge'

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function paymentLabel(method?: string) {
  const labels: Record<string, string> = {
    cash: 'Dinheiro',
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    card: 'Cartão',
  }
  return labels[method || ''] || method || 'Dinheiro'
}

export default function RideDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ridesStore = useRidesStore()
  const [ride, setRide] = useState<Ride | null>(null)
  const [processing, setProcessing] = useState(false)
  const [passengerRating, setPassengerRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [showRating, setShowRating] = useState(false)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [showMap, setShowMap] = useState(false)
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null)
  const authStore = useAuthStore()

  useEffect(() => {
    if (!id) return
    purgeTerminalDemoRide()
    ridesStore.fetchRide(id).then((data) => {
      if (data) {
        setRide(data)
        return
      }
      toast.info('Corrida encerrada')
      navigate('/', { replace: true })
    })
  }, [id, navigate, ridesStore])

  useRidePolling({ rideId: id, enabled: !!id, intervalMs: isDemoRideId(id) ? 2000 : 4000 })

  useEffect(() => {
    if (ridesStore.currentRide?.id == id) {
      setRide(ridesStore.currentRide)
    }
  }, [ridesStore.currentRide, id])

  useEffect(() => {
    if (!ride || ['completed', 'cancelled'].includes(ride.status)) return
    const stop = startLiveLocationTracking(
      (coords) => {
        setDriverPos([coords.lat, coords.lng])
        void authStore.updateLocation(coords.lat, coords.lng)
        if (isDemoRideId(ride.id)) {
          updateDemoRide({ driver_lat: coords.lat, driver_lng: coords.lng })
        }
      },
      () => {}
    )
    return stop
  }, [ride?.id, ride?.status])

  useEffect(() => {
    setShowMap(false)
    const timer = window.setTimeout(() => setShowMap(true), 200)
    return () => window.clearTimeout(timer)
  }, [id])

  useEffect(() => {
    if (!ride) return
    const originLat = ride.origin_lat || ride.pickup_lat || -23.5505
    const originLng = ride.origin_lng || ride.pickup_lng || -46.6333
    const destLat = ride.dest_lat || ride.dropoff_lat || -23.5615
    const destLng = ride.dest_lng || ride.dropoff_lng || -46.6565

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]) {
          setRoutePoints(
            data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
          )
        }
      })
      .catch(() => {
        setRoutePoints([
          [originLat, originLng],
          [destLat, destLng],
        ])
      })
  }, [ride?.id])

  const mapCenter = useMemo<[number, number]>(() => {
    if (driverPos) return driverPos
    if (!ride) return [-23.5505, -46.6333]
    return [
      ride.origin_lat || ride.pickup_lat || -23.5505,
      ride.origin_lng || ride.pickup_lng || -46.6333,
    ]
  }, [ride, driverPos])

  const mapMarkers = useMemo(() => {
    if (!ride) return []
    const markers = [
      {
        id: 'pickup',
        position: [
          ride.origin_lat || ride.pickup_lat || mapCenter[0],
          ride.origin_lng || ride.pickup_lng || mapCenter[1],
        ] as [number, number],
        popup: 'Embarque',
        icon: pickupMarkerIcon(),
      },
      {
        id: 'destination',
        position: [
          ride.dest_lat || ride.dropoff_lat || mapCenter[0] + 0.01,
          ride.dest_lng || ride.dropoff_lng || mapCenter[1] + 0.01,
        ] as [number, number],
        popup: 'Destino',
        icon: destinationMarkerIcon(),
      },
    ]
    if (driverPos) {
      markers.push({
        id: 'driver',
        position: driverPos,
        popup: 'Você',
        icon: pickupMarkerIcon(),
      })
    }
    return markers
  }, [ride, mapCenter, driverPos])

  const mapPolylines = useMemo(
    () => (routePoints.length ? [{ points: routePoints, color: '#169648', weight: 5 }] : []),
    [routePoints]
  )

  const runAction = async (
    action: () => Promise<{ success: boolean; message?: string }>,
    successMsg: string,
    onSuccess?: () => void
  ) => {
    if (!id) return
    setProcessing(true)
    const result = await action()
    if (result.success) {
      toast.success(successMsg)
      const updated = await ridesStore.fetchRide(id)
      if (updated) {
        setRide(updated)
      } else {
        navigate('/', { replace: true })
      }
      onSuccess?.()
    } else {
      toast.error(result.message || 'Erro na operação')
    }
    setProcessing(false)
  }

  const navigateToPickup = () => {
    const lat = ride?.origin_lat || ride?.pickup_lat
    const lng = ride?.origin_lng || ride?.pickup_lng
    if (lat && lng) openGoogleMapsNavigation(lat, lng)
  }

  const navigateToDestination = () => {
    const lat = ride?.dest_lat || ride?.dropoff_lat
    const lng = ride?.dest_lng || ride?.dropoff_lng
    if (lat && lng) openGoogleMapsNavigation(lat, lng)
  }

  const openWaze = () => {
    const lat = ['in_progress', 'destination_arrived'].includes(ride?.status || '')
      ? ride?.dest_lat || ride?.dropoff_lat
      : ride?.origin_lat || ride?.pickup_lat
    const lng = ['in_progress', 'destination_arrived'].includes(ride?.status || '')
      ? ride?.dest_lng || ride?.dropoff_lng
      : ride?.origin_lng || ride?.pickup_lng
    if (lat && lng) openWazeNavigation(lat, lng)
  }

  const submitPassengerRating = async () => {
    if (!id || passengerRating === 0) return
    setProcessing(true)
    const result = await ridesStore.ratePassenger(id, passengerRating, ratingComment)
    if (result.success) {
      toast.success('Avaliação enviada!')
      navigate('/')
    } else {
      toast.error(result.message || 'Erro ao avaliar')
    }
    setProcessing(false)
  }

  if (!ride) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="spinner h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p>Carregando corrida...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="h-56 overflow-hidden rounded-2xl">
        {showMap ? (
        <DriverMapView
          key={`ride-map-${ride.id}`}
          height="100%"
          width="100%"
          center={mapCenter}
          zoom={14}
          markers={mapMarkers}
          polyline={mapPolylines}
          autoFit={routePoints.length > 0}
        />
        ) : (
          <div className="map-loading-placeholder h-full w-full" />
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Ponto de embarque</p>
            <p className="text-sm font-medium">{ride.origin_address || ride.pickup_address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ponto de destino</p>
            <p className="text-sm font-medium">{ride.destination_address || ride.dropoff_address}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-gray-500">Valor</p>
            <p className="font-bold text-green-600">{formatCurrency(ride.estimated_fare || ride.price)}</p>
          </div>
          <div>
            <p className="text-gray-500">Pagamento</p>
            <p className="font-medium">{paymentLabel(ride.payment_method)}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium capitalize">{ride.status.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold capitalize">{ride.passenger_name || 'Passageiro'}</p>
            <p className="text-sm text-gray-500">Avaliação: {ride.passenger_rating?.toFixed(1) || '5.0'}</p>
          </div>
          <Link to={`/chat/${ride.id}`} className="rounded-full bg-blue-600 p-2 text-white">
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {ride.status === 'accepted' && (
          <>
            <button
              type="button"
              disabled={processing}
              onClick={() =>
                runAction(() => ridesStore.arriveAtPickup(ride.id), 'Chegada no embarque registrada!')
              }
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
            >
              Cheguei no embarque
            </button>
            <button
              type="button"
              onClick={navigateToPickup}
              className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-medium"
            >
              <Navigation className="h-5 w-5" />
              Navegar ao embarque
            </button>
          </>
        )}

        {ride.status === 'pickup_arrived' && (
          <button
            type="button"
            disabled={processing}
            onClick={() =>
              runAction(() => ridesStore.startRide(ride.id), 'Corrida iniciada!', navigateToDestination)
            }
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white"
          >
            Iniciar corrida
          </button>
        )}

        {ride.status === 'in_progress' && (
          <>
            <button
              type="button"
              disabled={processing}
              onClick={() =>
                runAction(() => ridesStore.arriveAtDestination(ride.id), 'Chegada no destino registrada!')
              }
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
            >
              Cheguei no destino
            </button>
            <button
              type="button"
              onClick={navigateToDestination}
              className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-medium"
            >
              <Navigation className="h-5 w-5" />
              Navegar ao destino
            </button>
          </>
        )}

        {ride.status === 'destination_arrived' && (
          <>
            {!ride.is_paid ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Aguardando o passageiro confirmar o pagamento ({paymentLabel(ride.payment_method)}).
              </div>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Pagamento confirmado pelo passageiro — pode finalizar a corrida.
              </div>
            )}
            <button
              type="button"
              disabled={processing || !ride.is_paid}
              onClick={() =>
                runAction(
                  () => ridesStore.completeRide(ride.id),
                  'Corrida finalizada!',
                  () => {
                    setShowRating(true)
                    setRide((prev) => (prev ? { ...prev, status: 'completed' } : prev))
                  }
                )
              }
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ride.is_paid ? 'Finalizar corrida' : 'Aguardando pagamento...'}
            </button>
          </>
        )}

        {['accepted', 'pickup_arrived', 'in_progress', 'destination_arrived'].includes(ride.status) && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={openWaze} className="rounded-xl border py-2 text-sm font-medium">
              Abrir Waze
            </button>
            <button
              type="button"
              onClick={ride.status === 'in_progress' || ride.status === 'destination_arrived' ? navigateToDestination : navigateToPickup}
              className="rounded-xl border py-2 text-sm font-medium"
            >
              Abrir Maps
            </button>
          </div>
        )}

        {ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <button
            type="button"
            disabled={processing}
            onClick={() => {
              const reason = prompt('Motivo do cancelamento:')
              if (!reason) return
              runAction(() => ridesStore.cancelRide(ride.id, reason), 'Corrida cancelada').then(() => navigate('/'))
            }}
            className="w-full rounded-xl border border-red-200 py-3 font-medium text-red-600"
          >
            Cancelar corrida
          </button>
        )}

        {(ride.status === 'completed' || showRating) && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="mb-2 font-semibold">Avalie o passageiro</p>
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setPassengerRating(n)}>
                  <Star className={`h-6 w-6 ${n <= passengerRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Comentário (opcional)"
              className="mb-3 w-full rounded-lg border p-2 text-sm"
              rows={2}
            />
            <button
              type="button"
              disabled={processing || passengerRating === 0}
              onClick={submitPassengerRating}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              Enviar avaliação
            </button>
          </div>
        )}

        {ride.status === 'completed' && !showRating && (
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
          >
            Ver histórico
          </button>
        )}
      </div>
    </div>
  )
}

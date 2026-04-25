import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RideMap } from '../components/RideMap'
import { cancelRideRequest, getRequestLocation, getRideRequest } from '../lib/api'
import { haversineKm } from '../lib/geodesic'
import { readSession } from '../lib/storage'
import { getApiErrorMessage, hasSuccessFalse } from '../lib/http'
import { tripRequestIdParamSchema } from '../lib/validation/schemas'

type Geo = { lat: number; lng: number }

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parseWalker(w: unknown): Geo | null {
  if (!w || typeof w !== 'object') return null
  const o = w as Record<string, unknown>
  const lat = num(o.latitude)
  const lng = num(o.longitude)
  if (lat == null || lng == null) return null
  return { lat, lng }
}

function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

export function TripStatusPage() {
  const navigate = useNavigate()
  const session = readSession()
  const params = useParams<{ requestId: string }>()
  const requestIdParsed = tripRequestIdParamSchema.safeParse(params.requestId)
  const requestId = requestIdParsed.success ? requestIdParsed.data : NaN

  const rideQuery = useQuery({
    queryKey: ['ride-status', requestId],
    queryFn: async () => {
      if (!session) throw new Error('Sessão inválida')
      return getRideRequest(session, requestId, { allowFailure: true })
    },
    refetchInterval: 3000,
    enabled: Number.isFinite(requestId) && requestId > 0 && !!session,
  })

  const data = rideQuery.data as Record<string, unknown> | undefined

  const confirmed = Number(data?.confirmed_walker) > 0
  const cancelled = Number(data?.is_cancelled) === 1
  const completed = Number(data?.is_completed) === 1
  const arrived = Number(data?.is_walker_arrived) === 1
  const tripStarted = Number(data?.is_started) === 1

  const locQuery = useQuery({
    queryKey: ['ride-location', requestId],
    queryFn: async () => {
      if (!session) throw new Error('Sessão inválida')
      return getRequestLocation(session, requestId)
    },
    refetchInterval: 2500,
    enabled: Number.isFinite(requestId) && requestId > 0 && !!session && confirmed && !cancelled && !completed,
  })

  const pickup = useMemo((): Geo | null => {
    const la = num(data?.owner_latitude)
    const ln = num(data?.owner_longitude)
    if (la == null || ln == null) return null
    return { lat: la, lng: ln }
  }, [data])

  const dest = useMemo((): Geo | null => {
    const la = num(data?.d_latitude)
    const ln = num(data?.d_longitude)
    if (la == null || ln == null) return null
    return { lat: la, lng: ln }
  }, [data])

  const driverFromApi = useMemo(() => parseWalker(data?.walker), [data])

  const driverLive = useMemo((): Geo | null => {
    const loc = locQuery.data
    if (loc && loc.success === true) {
      const la = num(loc.latitude)
      const ln = num(loc.longitude)
      if (la != null && ln != null) return { lat: la, lng: ln }
    }
    return driverFromApi
  }, [locQuery.data, driverFromApi])

  const headline = useMemo(() => {
    if (!data) return 'A carregar…'
    if (cancelled) return 'Corrida cancelada'
    if (completed) return 'Corrida concluída'
    if (tripStarted) return 'Viagem em curso'
    if (arrived) return 'Motorista no local de recolha'
    if (confirmed) return 'Motorista a caminho'
    if (hasSuccessFalse(data)) return typeof data.error === 'string' ? data.error : 'Estado do pedido'
    return 'A procurar motorista…'
  }, [data, cancelled, completed, tripStarted, arrived, confirmed])

  const distanceLabel = useMemo(() => {
    if (!driverLive) return null
    const target = tripStarted && dest ? dest : pickup
    if (!target) return null
    const km = haversineKm(driverLive, target)
    if (tripStarted && dest) return `Distância até ao destino · ${formatDistanceKm(km)}`
    return `Motorista a ${formatDistanceKm(km)} de ti`
  }, [driverLive, pickup, dest, tripStarted])

  const walkerName = useMemo(() => {
    const w = data?.walker
    if (!w || typeof w !== 'object') return ''
    const o = w as Record<string, unknown>
    const fn = typeof o.first_name === 'string' ? o.first_name : ''
    const ln = typeof o.last_name === 'string' ? o.last_name : ''
    return `${fn} ${ln}`.trim()
  }, [data])

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Sessão inválida')
      return cancelRideRequest(session, requestId)
    },
    onSuccess: (payload) => {
      if (hasSuccessFalse(payload)) return
      void rideQuery.refetch()
    },
  })

  const cancelPayload = cancelMutation.data
  const cancelErr =
    cancelPayload && hasSuccessFalse(cancelPayload)
      ? getApiErrorMessage(cancelPayload)
      : cancelMutation.isError
        ? (cancelMutation.error as Error).message
        : ''

  const apiFailed = data && hasSuccessFalse(data) && Number(data.error_code) !== 484
  const searching = !confirmed && !cancelled && !completed

  if (!session) return null

  return (
    <div className="pwa-trip-status">
      <div className="pwa-trip-status-mapwrap">
        <button type="button" className="pwa-trip-status-back" aria-label="Voltar ao início" onClick={() => navigate('/home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <RideMap
          origin={pickup}
          dest={dest}
          driver={confirmed ? driverLive : null}
          className="pwa-map-inner pwa-map-inner--trip-status"
        />
      </div>

      <div className="pwa-trip-status-sheet">
        <div className="pwa-trip-status-sheet-handle" aria-hidden />
        <p className="pwa-trip-status-kicker">
          Pedido #{requestId} <span className={`pwa-trip-status-pill${searching ? ' pwa-trip-status-pill--searching' : ''}`}>{searching ? 'procurando' : 'ativo'}</span>
        </p>
        <h1 className="pwa-trip-status-title">{headline}</h1>
        {walkerName && confirmed ? <p className="pwa-trip-status-driver">{walkerName}</p> : null}
        {distanceLabel && confirmed && !completed && !cancelled ? (
          <p className="pwa-trip-status-distance">{distanceLabel}</p>
        ) : null}
        {searching ? (
          <div className="pwa-trip-status-searching">
            <span className="pwa-trip-status-dot" aria-hidden />
            <span>A procurar motoristas perto de ti no mapa...</span>
          </div>
        ) : null}

        {rideQuery.isError ? <p className="pwa-sheet-error">{(rideQuery.error as Error).message}</p> : null}
        {apiFailed ? <p className="pwa-sheet-error">{getApiErrorMessage(data)}</p> : null}

        <div className="pwa-trip-status-actions">
          <button type="button" className="pwa-trip-status-btn pwa-trip-status-btn--ghost" onClick={() => void rideQuery.refetch()}>
            Atualizar
          </button>
          <button
            type="button"
            className="pwa-trip-status-btn pwa-trip-status-btn--danger"
            disabled={cancelMutation.isPending || cancelled || completed}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? 'A cancelar…' : 'Cancelar pedido'}
          </button>
        </div>
        {cancelErr ? <p className="pwa-sheet-error pwa-trip-status-cancel-err">{cancelErr}</p> : null}

        <button type="button" className="pwa-trip-status-new" onClick={() => navigate('/home')}>
          Novo pedido
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navigation } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useRidesStore } from '@/stores/rides'
import { useWalletStore } from '@/stores/wallet'
import { toast } from 'sonner'
import L from 'leaflet'
import RiderMapView, { RiderMapViewRef, MapMarker, MapPolyline } from '@/components/RiderMapView'
import RouteSearchBar from '@/components/RouteSearchBar'
import RideOfferSheet from '@/components/RideOfferSheet'
import HomeRideTrackingSheet from '@/components/HomeRideTrackingSheet'
import PromoBanner from '@/components/PromoBanner'
import LocationGate from '@/components/LocationGate'
import ChamaHeader from '@/components/ChamaHeader'
import ChamaDrawer from '@/components/ChamaDrawer'
import ChamaTabBar from '@/components/ChamaTabBar'
import { riderDrawerItems, riderTabBarItems } from '@/config/navigation'
import { CHAMA_LOGO_URL, CHAMA_APP_NAME } from '@/config/brand'
import {
  searchAddresses,
  reverseGeocode,
  fetchOsrmRoute,
  estimateFallbackRoute,
  generateStableNearbyDrivers,
  nudgeNearbyDrivers,
  getRecentDestinations,
  saveRecentDestination,
  filterPlacesByQuery,
  type NearbyDriverMarker,
} from '@/utils/navigation'
import { useEstimateFareQuery, calculateFareFromRoute, rideKeys } from '@/hooks/queries/useRideQueries'
import { useQueryClient } from '@tanstack/react-query'
import { calculateChamaFare, pickTrustedFare } from '@/utils/fareCalculator'
import { useHomeRideTracking } from '@/hooks/useHomeRideTracking'
import { useAppBanners } from '@/hooks/useAppBanners'
import { getCurrentLocation, startLiveLocationTracking, type GeoCoords } from '@/utils/geolocation'
import {
  getPersistedActiveRideId,
  getPersistedRideSnapshot,
  persistActiveRideId,
  persistRideSnapshot,
  clearActiveRideSession,
} from '@/utils/activeRideSession'
import { purgeTerminalDemoRide } from '@/utils/demoRideBridge'
import { dismissRide, isRideDismissed } from '@/utils/dismissedRides'

const CATEGORIES = [
  { id: 1, name: 'Moto', color: '#39ff6a', icon: '🏍️', description: 'Rápido e econômico' },
  { id: 2, name: 'Carro', color: '#ffffff', icon: '🚗', description: 'Conforto para o dia a dia' },
  { id: 3, name: 'Carro Premium', color: '#a78bfa', icon: '✨', description: 'Experiência premium' },
]

function destMarkerIcon() {
  return L.divIcon({
    className: 'dest-marker',
    html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function originMarkerIcon() {
  return L.divIcon({
    className: 'origin-marker',
    html: `<div style="background:#39ff6a;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function nearbyCarIcon(heading: number) {
  return L.divIcon({
    className: 'pwa-map-driver-pin',
    html: `<span style="display:block;font-size:22px;transform:rotate(${heading}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">🚗</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function HomeMapContent({
  seedCoords,
  initialTrackingId,
}: {
  seedCoords?: GeoCoords | null
  initialTrackingId?: string | number | null
}) {
  const authStore = useAuthStore()
  const ridesStore = useRidesStore()
  const walletStore = useWalletStore()
  const queryClient = useQueryClient()
  const mapRef = useRef<RiderMapViewRef | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destSearchAbortRef = useRef<AbortController | null>(null)
  const destSearchSeqRef = useRef(0)
  const seedAppliedRef = useRef(false)
  const hasOriginAddressRef = useRef(false)
  const locationErrorShownRef = useRef(false)
  const originFocusedRef = useRef(false)
  const destFocusedRef = useRef(false)
  const pendingDestQueryRef = useRef('')

  const [originInput, setOriginInput] = useState('Obtendo localização...')
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [userLiveCoords, setUserLiveCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [destinationInput, setDestinationInput] = useState('')
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [originSuggestions, setOriginSuggestions] = useState<Array<{ lat: number; lng: number; address: string }>>([])
  const [destSuggestions, setDestSuggestions] = useState<Array<{ lat: number; lng: number; address: string }>>([])
  const [recentDestinations, setRecentDestinations] = useState<Array<{ lat: number; lng: number; address: string }>>([])
  const [destSearchLoading, setDestSearchLoading] = useState(false)
  const [originFocused, setOriginFocused] = useState(false)
  const [destFocused, setDestFocused] = useState(false)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Carro')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [hasCard, setHasCard] = useState(false)
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriverMarker[]>([])
  const [trackingRideId, setTrackingRideId] = useState<string | number | null>(() => {
    if (initialTrackingId != null && initialTrackingId !== '') {
      if (isRideDismissed(initialTrackingId)) return null
      return initialTrackingId
    }
    purgeTerminalDemoRide()
    const snap = getPersistedRideSnapshot()
    if (snap?.status === 'completed' || snap?.status === 'cancelled') return null
    const persisted = getPersistedActiveRideId()
    if (persisted && isRideDismissed(persisted)) return null
    return persisted
  })

  const showOfferSheet = !!destinationCoords && !trackingRideId
  const { banner } = useAppBanners('rider', 'home')

  const effectiveTrackingId =
    trackingRideId && !isRideDismissed(trackingRideId) ? trackingRideId : null

  const rideTracking = useHomeRideTracking(effectiveTrackingId)
  const isTracking = !!effectiveTrackingId

  useEffect(() => {
    purgeTerminalDemoRide()

    const snap = getPersistedRideSnapshot()
    if (snap?.status === 'cancelled' || snap?.status === 'completed') {
      clearActiveRideSession()
      ridesStore.clearCurrentRide()
      return
    }

    if (snap && !ridesStore.currentRide) {
      ridesStore.setCurrentRide(snap)
    }
    const persistedId = getPersistedActiveRideId()
    const id = initialTrackingId ?? trackingRideId ?? persistedId
    if (id && !isRideDismissed(id) && snap?.status !== 'completed') {
      if (!trackingRideId) setTrackingRideId(id)
      void ridesStore.fetchRide(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'chama_demo_ride' || !effectiveTrackingId) return
      void queryClient.invalidateQueries({ queryKey: rideKeys.detail(effectiveTrackingId) })
      void queryClient.invalidateQueries({ queryKey: rideKeys.active })
      void ridesStore.fetchRide(effectiveTrackingId)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [effectiveTrackingId, queryClient, ridesStore])

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingRideId(initialTrackingId)
      persistActiveRideId(initialTrackingId)
      void ridesStore.fetchRide(initialTrackingId)
    }
  }, [initialTrackingId])

  useEffect(() => {
    if (effectiveTrackingId) {
      persistActiveRideId(effectiveTrackingId)
    } else {
      clearActiveRideSession()
    }
  }, [effectiveTrackingId])

  useEffect(() => {
    if (isTracking && rideTracking.displayRide) {
      const r = rideTracking.displayRide
      if (!['completed', 'cancelled'].includes(r.status || '')) {
        persistRideSnapshot(r)
      }
    }
  }, [isTracking, rideTracking.displayRide])

  useEffect(() => {
    if (!isTracking || !rideTracking.mapDriverLocation) return
    mapRef.current?.setCenter(rideTracking.mapDriverLocation.lat, rideTracking.mapDriverLocation.lng)
  }, [isTracking, rideTracking.mapDriverLocation?.lat, rideTracking.mapDriverLocation?.lng])

  const finishTracking = useCallback(() => {
    const id = effectiveTrackingId ?? trackingRideId
    if (id) {
      dismissRide(id)
      queryClient.removeQueries({ queryKey: rideKeys.detail(id) })
      queryClient.removeQueries({ queryKey: rideKeys.location(id) })
    }
    setTrackingRideId(null)
    setDestinationInput('')
    setDestinationCoords(null)
    setRoutePoints([])
    setRouteDistance(null)
    setRouteDuration(null)
    ridesStore.clearCurrentRide()
    queryClient.setQueryData(rideKeys.active, null)
    void queryClient.invalidateQueries({ queryKey: rideKeys.active })
  }, [effectiveTrackingId, trackingRideId, ridesStore, queryClient])

  const promoBanner = banner ? (
    <PromoBanner
      title={banner.title}
      subtitle={banner.subtitle}
      description={banner.description}
      ctaLabel={banner.cta_label || 'Saiba mais'}
      link={banner.link_url}
      imageUrl={banner.image_url}
    />
  ) : null

  const selectedCategoryId = useMemo(
    () => CATEGORIES.find((c) => c.name === selectedCategory)?.id ?? 2,
    [selectedCategory]
  )

  const { data: serverFare, isLoading: fareLoading } = useEstimateFareQuery(
    routeDistance,
    routeDuration,
    selectedCategoryId,
    selectedCategory,
    showOfferSheet
  )

  useEffect(() => {
    const r = rideTracking.displayRide
    if (!r || !isTracking) return
    if (r.origin_lat != null && r.origin_lng != null) {
      setOriginCoords({ lat: r.origin_lat, lng: r.origin_lng })
    }
    if (r.dest_lat != null && r.dest_lng != null) {
      setDestinationCoords({ lat: r.dest_lat, lng: r.dest_lng })
    }
  }, [rideTracking.displayRide?.id, isTracking])

  const categoriesWithPrice = useMemo(() => {
    if (!routeDistance || !routeDuration) {
      return CATEGORIES.map((cat) => ({ ...cat, fare: 0, estimatedPrice: '—' }))
    }

    const fmt = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

    return CATEGORIES.map((cat) => {
      const breakdown = calculateChamaFare(routeDistance, routeDuration, cat.name)
      const localFare = breakdown.estimated_fare
      const serverVal = cat.id === selectedCategoryId ? serverFare?.estimated_fare : null
      const fare = pickTrustedFare(localFare, serverVal)
      return {
        ...cat,
        fare,
        estimatedPrice: fmt(fare),
        surgeLabels: breakdown.surge_labels,
      }
    })
  }, [routeDistance, routeDuration, serverFare, selectedCategoryId])

  const fareBreakdown = useMemo(() => {
    if (!routeDistance || !routeDuration) return null
    return calculateChamaFare(routeDistance, routeDuration, selectedCategory)
  }, [routeDistance, routeDuration, selectedCategory])

  const selectedFare = useMemo(() => {
    const cat = categoriesWithPrice.find((c) => c.name === selectedCategory)
    return cat?.fare ?? 0
  }, [categoriesWithPrice, selectedCategory])

  const mapMarkers = useMemo(() => {
    const markers: MapMarker[] = []
    const tr = rideTracking.displayRide

    if (isTracking && tr) {
      if (tr.origin_lat != null && tr.origin_lng != null) {
        markers.push({
          id: 'origin',
          position: [tr.origin_lat, tr.origin_lng],
          icon: destMarkerIcon(),
          popup: tr.origin_address || tr.pickup_address || 'Você — embarque',
        })
      }
      if (tr.dest_lat != null && tr.dest_lng != null) {
        markers.push({
          id: 'destination',
          position: [tr.dest_lat, tr.dest_lng],
          icon: destMarkerIcon(),
          popup: tr.destination_address || 'Destino',
        })
      }
      rideTracking.trackingMarkers.forEach((m) => markers.push(m))
      return markers
    }

    if (!destinationCoords && nearbyDrivers.length) {
      nearbyDrivers.forEach((d) => {
        markers.push({
          id: d.id,
          position: [d.lat, d.lng],
          icon: nearbyCarIcon(d.heading),
        })
      })
    }

    if (originCoords) {
      markers.push({ id: 'origin', position: [originCoords.lat, originCoords.lng], icon: originMarkerIcon(), popup: originInput })
    }
    if (userLiveCoords && !destinationCoords) {
      markers.push({
        id: 'user-live',
        position: [userLiveCoords.lat, userLiveCoords.lng],
        icon: L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-location-pulse"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        popup: 'Você',
      })
    }
    if (destinationCoords) {
      markers.push({
        id: 'destination',
        position: [destinationCoords.lat, destinationCoords.lng],
        icon: destMarkerIcon(),
        popup: destinationInput,
        draggable: true,
      })
    }
    return markers
  }, [
    isTracking,
    rideTracking.displayRide,
    rideTracking.trackingMarkers,
    originCoords,
    destinationCoords,
    originInput,
    destinationInput,
    nearbyDrivers,
    userLiveCoords,
  ])

  const mapPolylines = useMemo<MapPolyline[]>(() => {
    if (isTracking && rideTracking.trackingPolylines.length) {
      return rideTracking.trackingPolylines
    }
    if (!routePoints.length) return []
    return [{ points: routePoints, color: '#39ff6a', weight: 5 }]
  }, [isTracking, rideTracking.trackingPolylines, routePoints])

  const applyOriginFromGps = useCallback(async (lat: number, lng: number, updateInput = true) => {
    setOriginCoords({ lat, lng })
    setUserLiveCoords((prev) => ({ lat, lng, accuracy: prev?.accuracy }))
    mapRef.current?.setCenter(lat, lng, 16)
    if (updateInput) {
      const addr = await reverseGeocode(lat, lng)
      setOriginInput(addr)
      hasOriginAddressRef.current = true
    }
  }, [])

  const startLocationUpdates = useCallback(() => {
    return startLiveLocationTracking(
      (coords) => {
        setUserLiveCoords(coords)
        setOriginCoords({ lat: coords.lat, lng: coords.lng })
        if (!hasOriginAddressRef.current) {
          void applyOriginFromGps(coords.lat, coords.lng, true)
        } else {
          mapRef.current?.setCenter(coords.lat, coords.lng)
        }
        authStore.updateLocation(coords.lat, coords.lng)
      },
      () => {
        if (locationErrorShownRef.current) return
        locationErrorShownRef.current = true
        setOriginInput((prev) => (prev === 'Obtendo localização...' ? 'Toque em GPS para localizar' : prev))
      }
    )
  }, [applyOriginFromGps, authStore])

  useEffect(() => {
    if (seedCoords && !seedAppliedRef.current) {
      seedAppliedRef.current = true
      void applyOriginFromGps(seedCoords.lat, seedCoords.lng)
      authStore.updateLocation(seedCoords.lat, seedCoords.lng)
    }
  }, [seedCoords, applyOriginFromGps, authStore])

  useEffect(() => {
    setRecentDestinations(getRecentDestinations())
  }, [])

  useEffect(() => {
    walletStore.fetchWallet().then(() => {
      setHasCard(useWalletStore.getState().paymentMethods.length > 0)
    })
    const stopTracking = startLocationUpdates()
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      if (destSearchDebounceRef.current) clearTimeout(destSearchDebounceRef.current)
      stopTracking()
    }
  }, [startLocationUpdates])

  const runOriginSearch = useCallback(async (value: string) => {
    const q = value.trim()
    if (q.length < 1) {
      setOriginSuggestions([])
      return
    }
    const anchor = originCoords ?? userLiveCoords ?? { lat: -22.9068, lng: -43.1729 }
    const near = { lat: anchor.lat, lng: anchor.lng, limit: 8, radiusKm: 40 }
    const results = await searchAddresses(q, near, {
      onPartial: (partial) => {
        if (originFocusedRef.current) setOriginSuggestions(partial)
      },
    })
    if (originFocusedRef.current) setOriginSuggestions(results)
  }, [originCoords, userLiveCoords])

  const runDestSearch = useCallback(async (value: string) => {
    const q = value.trim()
    if (q.length < 1) {
      setDestSuggestions([])
      setDestSearchLoading(false)
      return
    }

    destSearchAbortRef.current?.abort()
    const ac = new AbortController()
    destSearchAbortRef.current = ac
    const seq = ++destSearchSeqRef.current

    setDestSearchLoading(true)
    const anchor = originCoords ?? userLiveCoords ?? { lat: -22.9068, lng: -43.1729 }
    const near = { lat: anchor.lat, lng: anchor.lng, limit: 10, radiusKm: 80, wide: true }

    try {
      const results = await searchAddresses(q, near, {
        wide: true,
        signal: ac.signal,
        onPartial: (partial) => {
          if (seq !== destSearchSeqRef.current) return
          setDestSuggestions(partial)
          setDestSearchLoading(false)
        },
      })
      if (seq !== destSearchSeqRef.current) return
      setDestSuggestions(results)
    } catch {
      if (seq !== destSearchSeqRef.current) return
    } finally {
      if (seq === destSearchSeqRef.current) setDestSearchLoading(false)
    }
  }, [originCoords, userLiveCoords])

  useEffect(() => {
    if (!originCoords || !pendingDestQueryRef.current) return
    void runDestSearch(pendingDestQueryRef.current)
  }, [originCoords, runDestSearch])

  useEffect(() => {
    if (!originCoords || destinationCoords) {
      setNearbyDrivers([])
      return
    }

    const seed = generateStableNearbyDrivers(originCoords.lat, originCoords.lng)
    setNearbyDrivers(seed)

    const loadFromApi = async () => {
      const res = await ridesStore.getNearbyDrivers(originCoords.lat, originCoords.lng, selectedCategory)
      if (res.success && res.drivers?.length) {
        setNearbyDrivers(
          res.drivers.map((d: { id?: number; lat: number; lng: number; heading?: number }, i: number) => ({
            id: d.id ?? `api-${i}`,
            lat: d.lat,
            lng: d.lng,
            heading: d.heading ?? 0,
          }))
        )
      }
    }
    loadFromApi()

    const interval = window.setInterval(() => {
      setNearbyDrivers((prev) => {
        if (!originCoords) return prev
        return prev.length ? nudgeNearbyDrivers(prev, originCoords.lat, originCoords.lng) : seed
      })
    }, 12000)

    return () => window.clearInterval(interval)
  }, [originCoords, destinationCoords, selectedCategory, ridesStore])

  const calculateRoute = useCallback(async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    setRouteLoading(true)
    try {
      const result =
        (await fetchOsrmRoute(from.lat, from.lng, to.lat, to.lng)) ??
        estimateFallbackRoute(from.lat, from.lng, to.lat, to.lng)
      setRoutePoints(result.points)
      setRouteDistance(result.distance)
      setRouteDuration(result.duration)
    } catch {
      const fallback = estimateFallbackRoute(from.lat, from.lng, to.lat, to.lng)
      setRoutePoints(fallback.points)
      setRouteDistance(fallback.distance)
      setRouteDuration(fallback.duration)
    } finally {
      setRouteLoading(false)
    }
  }, [])

  useEffect(() => {
    if (originCoords && destinationCoords) {
      calculateRoute(originCoords, destinationCoords)
    }
  }, [originCoords, destinationCoords, calculateRoute])

  const debouncedOriginSearch = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    const q = value.trim()
    if (q.length < 1) {
      setOriginSuggestions([])
      return
    }
    searchDebounceRef.current = setTimeout(() => void runOriginSearch(value), 50)
  }

  const debouncedDestSearch = (value: string) => {
    pendingDestQueryRef.current = value.trim()
    if (destSearchDebounceRef.current) clearTimeout(destSearchDebounceRef.current)
    const q = value.trim()
    if (q.length < 1) {
      setDestSuggestions([])
      setDestSearchLoading(false)
      pendingDestQueryRef.current = ''
      destSearchAbortRef.current?.abort()
      return
    }
    const instant = filterPlacesByQuery(getRecentDestinations(), q)
    if (instant.length) setDestSuggestions(instant)
    setDestSearchLoading(true)
    destSearchDebounceRef.current = setTimeout(() => void runDestSearch(value), 50)
  }

  const handleDestFocus = () => {
    destFocusedRef.current = true
    setDestFocused(true)
    setRecentDestinations(getRecentDestinations())
    if (destinationInput.trim().length >= 1) {
      const instant = filterPlacesByQuery(getRecentDestinations(), destinationInput)
      if (instant.length) setDestSuggestions(instant)
      setDestSearchLoading(true)
      void runDestSearch(destinationInput)
    }
  }

  const selectOrigin = (place: { lat: number; lng: number; address: string }) => {
    setOriginInput(place.address)
    setOriginCoords({ lat: place.lat, lng: place.lng })
    setOriginSuggestions([])
    setOriginFocused(false)
    mapRef.current?.setCenter(place.lat, place.lng, 15)
  }

  const selectDestination = (place: { lat: number; lng: number; address: string }) => {
    setDestinationInput(place.address)
    setDestinationCoords({ lat: place.lat, lng: place.lng })
    setDestSuggestions([])
    setDestFocused(false)
    setDestSearchLoading(false)
    saveRecentDestination(place)
    setRecentDestinations(getRecentDestinations())
  }

  const handleMapClick = async (position: [number, number]) => {
    if (isTracking) return
    if (!originCoords) {
      toast.error('Aguarde o GPS definir sua origem')
      return
    }
    const addr = await reverseGeocode(position[0], position[1])
    selectDestination({ lat: position[0], lng: position[1], address: addr })
  }

  const handleMarkerDrag = async (id: string | number, position: [number, number]) => {
    if (id !== 'destination') return
    const addr = await reverseGeocode(position[0], position[1])
    setDestinationInput(addr)
    setDestinationCoords({ lat: position[0], lng: position[1] })
  }

  const swapOriginDestination = () => {
    const oInput = originInput
    const oCoords = originCoords
    setOriginInput(destinationInput)
    setDestinationInput(oInput)
    setOriginCoords(destinationCoords)
    setDestinationCoords(oCoords)
    setOriginSuggestions([])
    setDestSuggestions([])
    if (!destinationCoords || !originCoords) {
      setRoutePoints([])
      setRouteDistance(null)
      setRouteDuration(null)
    }
  }

  const clearDestination = () => {
    setDestinationInput('')
    setDestinationCoords(null)
    setRoutePoints([])
    setRouteDistance(null)
    setRouteDuration(null)
    setRouteLoading(false)
  }

  const priceLoading = routeLoading

  const requestRideWithData = async (
    dest: { lat: number; lng: number },
    destAddress: string,
    distance: number | null,
    duration: number | null,
    fare: number
  ) => {
    if (!originCoords || requesting) return
    if (fare <= 0 || distance == null || duration == null) {
      toast.error('Aguarde o cálculo do valor')
      return
    }
    if (paymentMethod === 'wallet' && walletStore.balance < fare) {
      toast.error('Saldo insuficiente na carteira')
      return
    }
    setRequesting(true)
    try {
      const result = await ridesStore.requestRide({
        origin_lat: originCoords.lat,
        origin_lng: originCoords.lng,
        origin_address: originInput,
        dest_lat: dest.lat,
        dest_lng: dest.lng,
        destination_address: destAddress,
        category: selectedCategory,
        category_id: selectedCategoryId,
        payment_method: paymentMethod,
        estimated_fare: fare,
        distance_meters: distance,
        duration_seconds: duration,
      })
      if (result.success && (result.ride || ridesStore.currentRide)) {
        const rideId = result.ride?.id || ridesStore.currentRide!.id
        setTrackingRideId(rideId)
        toast.success('Corrida solicitada! Buscando motorista...')
      } else {
        const msg = result.message || 'Erro ao solicitar corrida'
        if (/latitude|longitude|localiza/i.test(msg)) {
          toast.error('Origem (GPS) não definida. Toque no botão GPS e tente de novo.')
        } else {
          toast.error(msg)
        }
      }
    } catch {
      toast.error('Erro ao solicitar corrida')
    } finally {
      setRequesting(false)
    }
  }

  const handleConfirmRide = async () => {
    if (requesting || priceLoading) return
    if (!originCoords) {
      toast.error('Aguarde o GPS definir sua origem (embarque)')
      return
    }
    if (!destinationCoords) {
      toast.error('Escolha o destino na lista de sugestões abaixo')
      return
    }

    const dest = destinationCoords
    const destAddress = destinationInput.trim() || 'Destino'
    let distance = routeDistance
    let duration = routeDuration

    if (!distance || !duration) {
      setRouteLoading(true)
      try {
        const result =
          (await fetchOsrmRoute(originCoords.lat, originCoords.lng, dest.lat, dest.lng)) ??
          estimateFallbackRoute(originCoords.lat, originCoords.lng, dest.lat, dest.lng)
        distance = result.distance
        duration = result.duration
        setRoutePoints(result.points)
        setRouteDistance(distance)
        setRouteDuration(duration)
      } finally {
        setRouteLoading(false)
      }
    }

    const fare = selectedFare > 0 ? selectedFare : calculateFareFromRoute(distance!, duration!, selectedCategory)

    await requestRideWithData(dest, destAddress, distance, duration, fare)
  }

  const canConfirm =
    !!destinationCoords &&
    !!originCoords &&
    !requesting &&
    !routeLoading &&
    !fareLoading &&
    selectedFare > 0 &&
    routeDistance != null &&
    routeDuration != null

  const recenterMap = async () => {
    if (userLiveCoords) {
      await applyOriginFromGps(userLiveCoords.lat, userLiveCoords.lng, false)
      authStore.updateLocation(userLiveCoords.lat, userLiveCoords.lng)
      toast.success('Localização atualizada')
      return
    }
    try {
      const coords = await getCurrentLocation()
      locationErrorShownRef.current = false
      await applyOriginFromGps(coords.lat, coords.lng)
      authStore.updateLocation(coords.lat, coords.lng)
      toast.success('Localização atualizada')
    } catch {
      if (originCoords) {
        mapRef.current?.setCenter(originCoords.lat, originCoords.lng, 16)
      }
      toast.error('Não foi possível obter sua localização agora')
    }
  }

  return (
    <div className={`chama-home-body${showOfferSheet || isTracking ? ' chama-home--offer chama-home-body--sheet-open' : ''}`}>
      <main className={`chama-home-main${showOfferSheet || isTracking ? ' chama-home-main--offer' : ' chama-home-main--map'}`}>
        <div className="chama-map-stage">
          <RiderMapView
            ref={mapRef}
            height="100%"
            width="100%"
            center={originCoords ? [originCoords.lat, originCoords.lng] : [-23.5505, -46.6333]}
            zoom={15}
            markers={mapMarkers}
            polyline={mapPolylines}
            autoFit={!!routePoints.length || isTracking}
            onMapClick={handleMapClick}
            onMarkerDrag={handleMarkerDrag}
          />

          {!isTracking && (
          <div className="chama-search-wrap">
            <RouteSearchBar
              originInput={originInput}
              destinationInput={destinationInput}
              originFocused={originFocused}
              destFocused={destFocused}
              originSuggestions={originSuggestions}
              destSuggestions={destSuggestions}
              recentDestinations={recentDestinations}
              destLoading={destSearchLoading}
              onOriginChange={(v) => {
                setOriginInput(v)
                debouncedOriginSearch(v)
              }}
              onDestinationChange={(v) => {
                setDestinationInput(v)
                if (destinationCoords) {
                  setDestinationCoords(null)
                  setRoutePoints([])
                  setRouteDistance(null)
                  setRouteDuration(null)
                }
                debouncedDestSearch(v)
              }}
              onOriginFocus={() => {
                originFocusedRef.current = true
                setOriginFocused(true)
              }}
              onDestFocus={handleDestFocus}
              onOriginBlur={() => {
                originFocusedRef.current = false
                setOriginFocused(false)
              }}
              onDestBlur={() => {
                destFocusedRef.current = false
                setDestFocused(false)
              }}
              onSelectOrigin={selectOrigin}
              onSelectDestination={selectDestination}
              onClearDestination={clearDestination}
              onUseMyLocation={() => recenterMap()}
              onSwap={swapOriginDestination}
              onDestinationEnter={() => {
                if (destSuggestions.length > 0) {
                  void selectDestination(destSuggestions[0])
                }
              }}
            />
          </div>
          )}

          {isTracking && rideTracking.etaLabel && (
            <div className="chama-eta-badge">{rideTracking.etaLabel}</div>
          )}

          {!showOfferSheet && !isTracking && originCoords && (
            <div className="chama-map-nearby-badge">
              {nearbyDrivers.length} motorista{nearbyDrivers.length !== 1 ? 's' : ''} por perto
            </div>
          )}

          <div className="chama-map-controls" aria-label="Controles do mapa">
            <button
              type="button"
              className="chama-map-control-btn"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Aumentar zoom"
            >
              +
            </button>
            <button
              type="button"
              className="chama-map-control-btn"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Diminuir zoom"
            >
              −
            </button>
            <button
              type="button"
              className="chama-map-control-btn chama-map-control-btn--locate"
              onClick={recenterMap}
              aria-label="Centralizar mapa"
            >
              <Navigation className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showOfferSheet && (
          <RideOfferSheet
            categories={categoriesWithPrice}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            routeDistance={routeDistance}
            routeDuration={routeDuration}
            routeLoading={routeLoading}
            fareLoading={fareLoading}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            hasCard={hasCard}
            promo={promoBanner}
            onConfirm={handleConfirmRide}
            confirmDisabled={!canConfirm}
            confirming={requesting}
            confirmLabel={`Chamar ${selectedCategory}`}
            surgeHint={
              fareBreakdown?.surge_labels.length
                ? `Tarifa dinâmica: ${fareBreakdown.surge_labels.join(' · ')}`
                : undefined
            }
          />
        )}

        {isTracking && (
          rideTracking.displayRide ? (
            <HomeRideTrackingSheet
              ride={rideTracking.displayRide}
              isSearching={rideTracking.isSearching}
              isPaid={rideTracking.isPaid}
              isCompleted={rideTracking.isCompleted}
              demoEnabled={rideTracking.demoEnabled}
              onCancel={finishTracking}
              onFinished={finishTracking}
            />
          ) : (
            <div className="chama-offer-sheet-99 flex flex-col items-center px-6 py-10">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#39ff6a]/30 border-t-[#39ff6a]" />
              <p className="text-sm text-gray-400">Carregando corrida...</p>
            </div>
          )
        )}
      </main>

      <ChamaTabBar items={riderTabBarItems} />
    </div>
  )
}

export default function HomeView() {
  const [seedCoords, setSeedCoords] = useState<GeoCoords | null>(null)
  const welcomeToastRef = useRef(false)

  const handleLocationGranted = useCallback((coords?: GeoCoords) => {
    if (coords) setSeedCoords(coords)
    if (!welcomeToastRef.current) {
      welcomeToastRef.current = true
      toast.success('Localização ativada!')
    }
  }, [])

  return (
    <div className="chama-home chama-app-frame">
      <HomeShell seedCoords={seedCoords} onLocationGranted={handleLocationGranted} />
    </div>
  )
}

function HomeShell({
  seedCoords,
  onLocationGranted,
  trackingRideId,
}: {
  seedCoords?: GeoCoords | null
  onLocationGranted?: (coords?: GeoCoords) => void
  trackingRideId?: string | number | null
}) {
  const authStore = useAuthStore()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const userName = authStore.user?.first_name || 'Usuário'
  const userFullName = authStore.user
    ? `${authStore.user.first_name} ${authStore.user.last_name || ''}`.trim()
    : 'Passageiro'
  const userInitial = userName.charAt(0).toUpperCase()

  const logout = async () => {
    await authStore.logout()
    navigate('/login')
  }

  return (
    <div className="chama-home-inner">
      <ChamaHeader
        userName={userName}
        userInitial={userInitial}
        onMenuOpen={() => setDrawerOpen(true)}
        right={
          <Link to="/wallet" className="chama-btn-outline chama-btn-sm chama-wallet-btn" aria-label="Carteira">
            💳
          </Link>
        }
      />

      <ChamaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={userFullName}
        userEmail={authStore.user?.email}
        userInitial={userInitial}
        items={riderDrawerItems}
        onLogout={logout}
      />

      <LocationGate logoUrl={CHAMA_LOGO_URL} appName={CHAMA_APP_NAME} onGranted={onLocationGranted ?? (() => {})}>
        <HomeMapContent seedCoords={seedCoords} initialTrackingId={trackingRideId} />
      </LocationGate>
    </div>
  )
}

export { HomeShell }

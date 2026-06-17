import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useRidesStore } from '@/stores/rides'
import { toast } from 'sonner'
import RiderMapView, { RiderMapViewRef } from '@/components/RiderMapView'

interface Category {
  id: number
  name: string
  color: string
  icon: string
  description: string
  estimatedPrice: string
  baseFare: number
  perKm: number
  perMin: number
}

export default function HomeView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const ridesStore = useRidesStore()

  const mapRef = useRef<RiderMapViewRef | null>(null)

  const [currentAddress, setCurrentAddress] = useState('Obtendo localização...')
  const [destinationInput, setDestinationInput] = useState('')
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [extraStops, setExtraStops] = useState<string[]>([])
  const [observations, setObservations] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [userName, setUserName] = useState('Usuário')
  const [userInitial, setUserInitial] = useState('U')

  const [showPriceEstimate, setShowPriceEstimate] = useState(false)
  const [searchingDrivers, setSearchingDrivers] = useState(false)
  const [searchingMessage, setSearchingMessage] = useState('Procurando motoristas próximos...')
  const [requesting, setRequesting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Carro')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card'>('cash')
  const [hasCard, setHasCard] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Moto', color: '#FFD700', icon: '🏍️', description: 'Viagens rápidas e econômicas', estimatedPrice: 'R$ 12,50', baseFare: 5, perKm: 2.5, perMin: 0.3 },
    { id: 2, name: 'Carro', color: '#1E3A8A', icon: '🚗', description: 'Viagens confortáveis', estimatedPrice: 'R$ 18,90', baseFare: 8, perKm: 3.5, perMin: 0.5 },
    { id: 3, name: 'Carro Premium', color: '#7C3AED', icon: '✨', description: 'Carros de luxo', estimatedPrice: 'R$ 32,40', baseFare: 15, perKm: 5.5, perMin: 0.8 },
  ])

  const searchSimulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getSelectedPrice = useMemo(() => {
    const cat = categories.find((c) => c.name === selectedCategory)
    return cat ? cat.estimatedPrice : 'R$ 0,00'
  }, [categories, selectedCategory])

  useEffect(() => {
    if (authStore.user) {
      const name = authStore.user.first_name || 'Usuário'
      setUserName(name)
      setUserInitial(name.charAt(0).toUpperCase())
      setWalletBalance(0) // Will fetch or keep 0
      setHasCard(false)
    }
    startLocationUpdates()

    return () => {
      if (searchSimulationIntervalRef.current) clearInterval(searchSimulationIntervalRef.current)
    }
  }, [authStore.user])

  const startLocationUpdates = () => {
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateUserLocation(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setCurrentAddress('Não foi possível obter localização')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    navigator.geolocation.watchPosition(
      (position) => {
        updateUserLocation(position.coords.latitude, position.coords.longitude)
        authStore.updateLocation(position.coords.latitude, position.coords.longitude)
      },
      (error) => console.error('Watch error:', error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  const updateUserLocation = async (lat: number, lng: number) => {
    mapRef.current?.setCenter(lat, lng, 16)

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`)
      const data = await response.json()
      if (data.display_name) {
        setCurrentAddress(data.display_name.split(',').slice(0, 3).join(', '))
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const centerMap = () => {
    mapRef.current?.locateUser()
  }

  const handleMapClick = (position: [number, number]) => {
    setDestinationCoords({ lat: position[0], lng: position[1] })
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&addressdetails=1&accept-language=pt-BR`)
      .then((r) => r.json())
      .then((data) => {
        if (data.display_name) {
          const addr = data.display_name.split(',').slice(0, 3).join(', ')
          setDestinationInput(addr)
          setShowPriceEstimate(true)
          calculateRoute(position[0], position[1], addr)
        }
      })
      .catch(console.error)
  }

  const calculateRoute = async (destLat: number, destLng: number, destAddr: string) => {
    try {
      const userLoc = mapRef.current?.map?.getCenter()
      if (!userLoc) return

      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${destLng},${destLat}?overview=full&geometries=geojson`)
      const data = await response.json()

      if (data.routes && data.routes[0]) {
        const route = data.routes[0]
        const distance = route.distance
        const duration = route.duration

        setCategories((prev) =>
          prev.map((cat) => {
            const fare = cat.baseFare + (distance / 1000) * cat.perKm + (duration / 60) * cat.perMin
            return {
              ...cat,
              estimatedPrice: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fare),
            }
          })
        )

        mapRef.current?.clearPolylines()
        mapRef.current?.addPolyline({
          points: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][],
          color: '#007bff',
          weight: 5,
        })

        mapRef.current?.addMarker({
          id: 'destination',
          position: [destLat, destLng],
          draggable: true,
          popup: destAddr,
        })

        setTimeout(() => {
          mapRef.current?.fitBounds()
        }, 100)
      }
    } catch (error) {
      console.error('Route calculation error:', error)
    }
  }

  const handleMarkerDrag = (id: string | number, position: [number, number]) => {
    if (id === 'destination') {
      handleMapClick(position)
    }
  }

  const openDestinationSearch = () => {
    // Navigate or trigger input mode
    const query = prompt('Para onde você deseja ir?')
    if (query && query.trim()) {
      setDestinationInput(query)
      onSearchAddress(query)
    }
  }

  const onSearchAddress = async (query: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&accept-language=pt-BR&countrycodes=br`)
      const results = await response.json()

      if (results.length > 0) {
        const place = results[0]
        const coords = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) }
        setDestinationCoords(coords)
        setShowPriceEstimate(true)
        calculateRoute(coords.lat, coords.lng, place.display_name.split(',').slice(0, 3).join(', '))
      } else {
        toast.error('Endereço não encontrado')
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const addStop = () => {
    if (extraStops.length < 2) {
      const newStop = prompt(`Digite o endereço da Parada ${extraStops.length + 1}:`)
      if (newStop && newStop.trim()) {
        setExtraStops((prev) => [...prev, newStop])
      }
    }
  }

  const removeStop = (index: number) => {
    setExtraStops((prev) => prev.filter((_, i) => i !== index))
  }

  const clearDestination = () => {
    setDestinationInput('')
    setDestinationCoords(null)
    setShowPriceEstimate(false)
    mapRef.current?.removeMarker('destination')
    mapRef.current?.clearPolylines()
  }

  const requestRide = async () => {
    if (!destinationCoords || requesting) return
    setRequesting(true)

    const userLoc = mapRef.current?.map?.getCenter()
    if (!userLoc) {
      toast.warning('Aguardando localização...')
      setRequesting(false)
      return
    }

    const rideData = {
      origin_lat: userLoc.lat,
      origin_lng: userLoc.lng,
      origin_address: currentAddress,
      dest_lat: destinationCoords.lat,
      dest_lng: destinationCoords.lng,
      destination_address: destinationInput,
      category: selectedCategory,
      payment_method: paymentMethod,
      observations: observations,
      stops: extraStops.map((addr, i) => ({ address: addr, order: i + 1 })),
    }

    try {
      const result = await ridesStore.requestRide(rideData)
      if (result.success) {
        setShowPriceEstimate(false)
        setSearchingDrivers(true)
        setSearchingMessage('Procurando motoristas próximos...')
        simulateDriverSearch()
      } else {
        toast.error(result.message || 'Erro ao solicitar corrida')
      }
    } catch (error) {
      toast.error('Erro ao solicitar corrida')
    } finally {
      setRequesting(false)
    }
  }

  const simulateDriverSearch = () => {
    const messages = [
      'Procurando motoristas próximos...',
      'Encontramos motoristas disponíveis!',
      'Enviando solicitação para motoristas...',
      'Aguardando resposta dos motoristas...',
      'Quase lá... um motorista aceitou!',
    ]

    let i = 0
    searchSimulationIntervalRef.current = setInterval(() => {
      i++
      if (i < messages.length) {
        setSearchingMessage(messages[i])
      } else {
        if (searchSimulationIntervalRef.current) clearInterval(searchSimulationIntervalRef.current)
        setSearchingDrivers(false)
        toast.success('Motorista encontrado!')
        navigate(`/ride/${ridesStore.currentRide?.id || '1'}`)
      }
    }, 2000)
  }

  const cancelSearch = () => {
    if (searchSimulationIntervalRef.current) clearInterval(searchSimulationIntervalRef.current)
    setSearchingDrivers(false)
    ridesStore.cancelRide(ridesStore.currentRide?.id || '', 'Cancelado pelo passageiro')
    toast.info('Busca cancelada')
  }

  const togglePause = () => {
    setIsPaused((prev) => {
      const newVal = !prev
      toast.info(newVal ? 'Pausado' : 'Ativo')
      return newVal
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="screen active" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header className="screen-header" style={{ background: 'white', zIndex: 10, padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar avatar-sm" style={{ background: '#28a745', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              <span>{userInitial}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--gray-900)' }}>{userName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Saldo: <span style={{ color: '#28a745', fontWeight: 600 }}>{formatCurrency(walletBalance)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={togglePause} style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--gray-300)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>
              <span style={{ color: isPaused ? 'var(--warning)' : 'var(--gray-600)' }}>
                {isPaused ? '▶ Retomar' : '⏸ Pausar'}
              </span>
            </button>
            <Link to="/wallet" className="btn btn-outline btn-sm" style={{ padding: '0.375rem', border: '1px solid var(--gray-300)', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="screen-content" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <RiderMapView
          ref={mapRef}
          height="100%"
          width="100%"
          center={[-23.5505, -46.6333]}
          zoom={15}
          markers={[]}
          showUserLocation={true}
          onMapClick={handleMapClick}
          onMarkerDrag={handleMarkerDrag}
        />

        <div className="search-card" style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', zIndex: 5, pointerEvents: 'auto' }}>
          <div className="card" style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', padding: '1rem' }}>
            <div className="search-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="location-dot origin" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28a745', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Sua localização</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-800)' }}>{currentAddress}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={centerMap} style={{ padding: '0.375rem', border: '1px solid var(--gray-300)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', paddingLeft: '18px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '5px', top: -5, bottom: -5, width: '2px', background: 'repeating-linear-gradient(to bottom, #ced4da, #ced4da 4px, transparent 4px, transparent 8px)' }} />
            </div>

            <div className="search-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="location-dot destination" style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--danger)', background: 'white', flexShrink: 0 }} />
              <input
                type="text"
                className="form-control"
                placeholder="Para onde você vai?"
                value={destinationInput}
                onClick={openDestinationSearch}
                style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 0', fontSize: '1rem', borderBottom: '1px solid var(--gray-200)', outline: 'none', cursor: 'pointer' }}
                readOnly
              />
              {destinationInput && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" onClick={clearDestination} style={{ cursor: 'pointer' }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            {extraStops.map((stop, index) => (
              <div key={index} className="search-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="location-dot stop" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#007bff', flexShrink: 0 }} />
                <input
                  type="text"
                  className="form-control"
                  value={stop}
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 0', fontSize: '0.875rem', borderBottom: '1px solid var(--gray-200)', outline: 'none' }}
                  readOnly
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" onClick={() => removeStop(index)} style={{ cursor: 'pointer' }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            ))}

            {extraStops.length < 2 && (
              <button className="btn btn-link btn-sm" onClick={addStop} style={{ marginTop: '0.5rem', color: '#007bff', background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar parada
              </button>
            )}
          </div>
        </div>

        {showPriceEstimate && (
          <div className="price-estimate-sheet" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'white', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', boxShadow: 'var(--shadow-lg)', padding: '1rem', maxWidth: '100vw' }}>
            <div style={{ width: '40px', height: '4px', background: 'var(--gray-300)', borderRadius: '2px', margin: '0 auto 1rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Escolha uma categoria</h3>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', background: '#007bff', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{selectedCategory}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`category-option ${selectedCategory === cat.name ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: selectedCategory === cat.name ? '2px solid #007bff' : '2px solid var(--gray-200)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: selectedCategory === cat.name ? '#f0f7ff' : 'white' }}
                >
                  <div style={{ background: cat.color, width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{cat.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#007bff' }}>{cat.estimatedPrice}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--gray-500)' }}>estimado</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', fontWeight: 500 }}>Forma de pagamento</div>
              <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)', fontSize: '0.875rem' }}>
                <option value="cash">Dinheiro</option>
                <option value="pix">Pix</option>
                {hasCard && <option value="card">Cartão salvo</option>}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', fontWeight: 500 }}>Observações (opcional)</label>
              <textarea className="form-control" value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} placeholder="Ex: Cadeirante, levar malas, etc" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)', fontSize: '0.875rem', resize: 'none' }} />
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={requestRide} disabled={requesting} style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius)', background: '#007bff', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {requesting ? <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <span>Confirmar {selectedCategory} - {getSelectedPrice}</span>}
            </button>
          </div>
        )}

        {searchingDrivers && (
          <div className="searching-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ width: '80px', height: '80px', border: '6px solid rgba(0,0,0,0.1)', borderTopColor: '#007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--gray-950)' }}>Buscando motorista...</h3>
            <p style={{ color: 'var(--gray-500)', textAlign: 'center', marginBottom: '1.5rem' }}>{searchingMessage}</p>
            <button className="btn btn-danger" onClick={cancelSearch} style={{ padding: '0.75rem 1.5rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar busca</button>
          </div>
        )}
      </main>

      <nav className="bottom-nav" style={{ background: 'white', borderTop: '1px solid var(--gray-200)', display: 'flex', height: '64px', justifyContent: 'space-around', alignItems: 'center' }}>
        <Link to="/home" className="bottom-nav-item active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: '#007bff' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="bottom-nav-label" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Início</span>
        </Link>
        <Link to="/trips" className="bottom-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'var(--gray-500)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="bottom-nav-label" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Viagens</span>
        </Link>
        <Link to="/wallet" className="bottom-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'var(--gray-500)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span className="bottom-nav-label" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Carteira</span>
        </Link>
        <Link to="/profile" className="bottom-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'var(--gray-500)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="bottom-nav-label" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Perfil</span>
        </Link>
      </nav>
    </div>
  )
}
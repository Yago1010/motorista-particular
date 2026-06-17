import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRidesStore } from '@/stores/rides'
import { toast } from 'sonner'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Stop {
  address: string
}

interface Category {
  id: number
  name: string
  color: string
  estimatedPrice: string
  baseFare: number
  perKm: number
  perMin: number
}

export default function RequestRideView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ridesStore = useRidesStore()

  const miniMapContainerRef = useRef<HTMLDivElement | null>(null)
  const miniMapRef = useRef<L.Map | null>(null)

  const [confirming, setConfirming] = useState(false)
  const [rideData, setRideData] = useState({
    origin_address: 'Minha localização atual',
    origin_coords: { lat: -23.5505, lng: -46.6333 },
    destination_address: '',
    destination_coords: null as { lat: number; lng: number } | null,
    stops: [] as Stop[],
    category: 'Carro',
    payment_method: 'cash' as 'cash' | 'pix' | 'card',
    observations: '',
  })

  const [categories] = useState<Category[]>([
    { id: 1, name: 'Moto', color: '#FFD700', estimatedPrice: 'R$ 12,50', baseFare: 5, perKm: 2.5, perMin: 0.3 },
    { id: 2, name: 'Carro', color: '#1E3A8A', estimatedPrice: 'R$ 18,90', baseFare: 8, perKm: 3.5, perMin: 0.5 },
    { id: 3, name: 'Carro Premium', color: '#7C3AED', estimatedPrice: 'R$ 32,40', baseFare: 15, perKm: 5.5, perMin: 0.8 },
  ])

  const getSelectedPrice = () => {
    const cat = categories.find((c) => c.name === rideData.category)
    return cat ? cat.estimatedPrice : 'R$ 0,00'
  }

  useEffect(() => {
    // Load ride data from query params if available
    const destLat = searchParams.get('dest_lat')
    const destLng = searchParams.get('dest_lng')
    const destAddr = searchParams.get('dest_address')

    if (destLat && destLng) {
      setRideData((prev) => ({
        ...prev,
        destination_coords: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
        destination_address: destAddr ? decodeURIComponent(destAddr) : 'Destino Selecionado',
      }))
    }
  }, [searchParams])

  useEffect(() => {
    if (!miniMapContainerRef.current || miniMapRef.current || !rideData.destination_coords) return

    const origin = [rideData.origin_coords.lat, rideData.origin_coords.lng] as [number, number]
    const dest = [rideData.destination_coords.lat, rideData.destination_coords.lng] as [number, number]

    const map = L.map(miniMapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView(dest, 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.marker(origin, {
      icon: L.divIcon({
        className: 'mini-marker origin',
        html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #28a745; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map)

    L.marker(dest, {
      icon: L.divIcon({
        className: 'mini-marker dest',
        html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #dc3545; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map)

    L.polyline([origin, dest], { color: '#007bff', weight: 3, dashArray: '5, 5' }).addTo(map)

    const bounds = L.latLngBounds([origin, dest])
    map.fitBounds(bounds, { padding: [20, 20] })

    miniMapRef.current = map

    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove()
        miniMapRef.current = null
      }
    }
  }, [rideData.destination_coords])

  const addStop = () => {
    const addr = prompt('Digite o endereço da parada:')
    if (addr && addr.trim()) {
      setRideData((prev) => ({
        ...prev,
        stops: [...prev.stops, { address: addr }],
      }))
    }
  }

  const removeStop = (index: number) => {
    setRideData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }))
  }

  const selectCategory = (catName: string) => {
    setRideData((prev) => ({ ...prev, category: catName }))
  }

  const selectPaymentMethod = (method: 'cash' | 'pix' | 'card') => {
    setRideData((prev) => ({ ...prev, payment_method: method }))
  }

  const confirmRide = async () => {
    if (!rideData.destination_address || confirming) return
    setConfirming(true)

    const payload = {
      origin_lat: rideData.origin_coords.lat,
      origin_lng: rideData.origin_coords.lng,
      origin_address: rideData.origin_address,
      dest_lat: rideData.destination_coords?.lat,
      dest_lng: rideData.destination_coords?.lng,
      destination_address: rideData.destination_address,
      category: rideData.category,
      payment_method: rideData.payment_method,
      observations: rideData.observations,
      stops: rideData.stops.map((s, i) => ({ address: s.address, order: i + 1 })),
    }

    try {
      const result = await ridesStore.requestRide(payload)
      if (result.success) {
        toast.success('Corrida solicitada! Buscando motorista...')
        navigate('/home')
      } else {
        toast.error(result.message || 'Erro ao solicitar corrida')
      }
    } catch (error) {
      toast.error('Erro ao solicitar corrida')
    } finally {
      setConfirming(false)
    }
  }

  const handleDestinationClick = () => {
    const query = prompt('Para onde você deseja ir?')
    if (query && query.trim()) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1&accept-language=pt-BR&countrycodes=br`)
        .then((r) => r.json())
        .then((results) => {
          if (results.length > 0) {
            const place = results[0]
            setRideData((prev) => ({
              ...prev,
              destination_coords: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
              destination_address: place.display_name.split(',').slice(0, 3).join(', '),
            }))
          } else {
            toast.error('Endereço não encontrado')
          }
        })
        .catch(console.error)
    }
  }

  return (
    <div className="screen active" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--gray-50)' }}>
      <header className="screen-header" style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/home')} style={{ padding: '0.5rem', background: 'none', border: '1px solid var(--gray-300)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="screen-title" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Nova Corrida</h1>
        <div style={{ width: '38px' }} />
      </header>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="card" style={{ background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="location-dot origin" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Origem</div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{rideData.origin_address}</div>
            </div>
          </div>
        </div>

        {rideData.stops.map((stop, index) => (
          <div key={index} className="card" style={{ background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div className="location-dot stop" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#007bff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Parada {index + 1}</div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{stop.address}</div>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => removeStop(index)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid var(--danger)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Remover</button>
          </div>
        ))}

        {rideData.stops.length < 2 && (
          <button className="btn btn-link" onClick={addStop} style={{ background: 'none', border: 'none', color: '#007bff', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar parada
          </button>
        )}

        <div className="card" style={{ background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div className="location-dot destination" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid var(--danger)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Destino</div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{rideData.destination_address || 'Selecione no mapa'}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleDestinationClick} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--gray-300)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            {rideData.destination_address ? 'Alterar' : 'Definir'}
          </button>
        </div>

        {rideData.destination_coords && (
          <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div ref={miniMapContainerRef} style={{ height: '200px', width: '100%' }} />
          </div>
        )}

        <div className="card" style={{ background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Escolha a categoria</div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.name)}
                className={`category-btn ${rideData.category === cat.name ? 'active' : ''}`}
                style={{ flexShrink: 0, padding: '0.75rem', borderRadius: '8px', border: rideData.category === cat.name ? '2px solid #007bff' : '2px solid var(--gray-200)', background: 'white', cursor: 'pointer', minWidth: '100px', textAlign: 'center' }}
              >
                <div style={{ background: cat.color, width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  {cat.name === 'Moto' ? '🏍️' : cat.name === 'Carro' ? '🚗' : '✨'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-900)' }}>{cat.name}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--gray-500)' }}>{cat.estimatedPrice}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Forma de pagamento</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['cash', 'pix', 'card'] as const).map((method) => (
              <button
                key={method}
                onClick={() => selectPaymentMethod(method)}
                className={`payment-method-btn ${rideData.payment_method === method ? 'active' : ''}`}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: rideData.payment_method === method ? '2px solid #007bff' : '2px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
              >
                <span style={{ fontSize: '1.25rem' }}>{method === 'cash' ? '💵' : method === 'pix' ? '📱' : '💳'}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{method === 'cash' ? 'Dinheiro' : method === 'pix' ? 'Pix' : 'Cartão'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: 'white', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Observações (opcional)</div>
          <textarea
            className="form-control"
            value={rideData.observations}
            onChange={(e) => setRideData((prev) => ({ ...prev, observations: e.target.value }))}
            rows={2}
            placeholder="Ex: Cadeirante, levar malas, portão automático..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)', fontSize: '0.875rem', resize: 'none' }}
          />
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={confirmRide} disabled={!rideData.destination_address || confirming} style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: '#007bff', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {confirming ? <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <span>Solicitar {rideData.category} - {getSelectedPrice()}</span>}
        </button>
      </div>
    </div>
  )
}
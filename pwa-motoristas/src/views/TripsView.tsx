import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRidesStore } from '@/stores/rides'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingOverlay } from '@/components/LoadingOverlay'

const formatDistance = (meters: number) => {
  if (!meters) return '---'
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

const formatCurrency = (value: number) => {
  if (!value) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatTime = (seconds: number) => {
  if (!seconds) return '---'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}min`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TripsView() {
  const navigate = useNavigate()
  const { rides, loading, fetchRides } = useRidesStore()
  const { success, error } = useToastStore()
  const [localRides, setLocalRides] = useState<any[]>([])
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    loadRides()
  }, [])

  const loadRides = async () => {
    setLocalLoading(true)
    try {
      await fetchRides()
      // Use mock data for now since the store might not have fetchRides implemented
      setLocalRides([
        {
          id: '1',
          final_fare: 32.50,
          estimated_fare: 30.00,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          duration: 1320,
          origin_address: 'Shopping Center, São Paulo',
          destination_address: 'Residencial Jardins, São Paulo',
          distance: 8500,
          passenger_name: 'Ana Silva',
          rating: 4.8,
        },
        {
          id: '2',
          final_fare: 58.00,
          estimated_fare: 55.00,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          duration: 2100,
          origin_address: 'Aeroporto de Guarulhos',
          destination_address: 'Hotel Centro, São Paulo',
          distance: 15200,
          passenger_name: 'Carlos Santos',
          rating: 4.5,
        },
        {
          id: '3',
          final_fare: 0,
          estimated_fare: 18.50,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          duration: 900,
          origin_address: 'Universidade USP',
          destination_address: 'Shopping Morumbi',
          distance: 5100,
          passenger_name: 'Maria Oliveira',
          rating: 4.9,
        },
      ])
    } catch (err) {
      error('Erro ao carregar histórico')
    } finally {
      setLocalLoading(false)
    }
  }

  const viewRide = (rideId: string) => {
    navigate(`/ride/${rideId}`)
  }

  return (
    <div className="screen active">
      <header className="screen-header">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="screen-title">Histórico de Corridas</h1>
        <div />
      </header>

      <div className="screen-content">
        {localLoading && localRides.length === 0 && (
          <LoadingOverlay message="Carregando histórico..." />
        )}

        {localRides.length === 0 && !localLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Nenhuma corrida no histórico</h2>
            <p style={{ color: 'var(--gray-500)' }}>Suas corridas completadas aparecerão aqui</p>
          </div>
        )}

        {localRides.length > 0 && !localLoading && (
          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <div>
              {localRides.map((ride: any) => (
                <div key={ride.id} className="ride-card" onClick={() => viewRide(ride.id)}>
                  <div className="ride-card-header">
                    <div>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Concluída</span>
                      <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '1.25rem' }}>{formatCurrency(ride.final_fare || ride.estimated_fare)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{formatDate(ride.created_at)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{formatTime(ride.duration)}</div>
                    </div>
                  </div>

                  <div className="ride-info">
                    <div className="ride-location">
                      <div className="ride-location-icon origin">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <div className="ride-location-text">
                        <div className="ride-location-label">Origem</div>
                        <div className="ride-location-address">{ride.origin_address}</div>
                      </div>
                    </div>

                    <div className="ride-location">
                      <div className="ride-location-icon destination">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                        </svg>
                      </div>
                      <div className="ride-location-text">
                        <div className="ride-location-label">Destino</div>
                        <div className="ride-location-address">{ride.destination_address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="ride-meta">
                    <div className="ride-meta-item">
                      <span className="ride-meta-label">Distância</span>
                      <span className="ride-meta-value">{formatDistance(ride.distance)}</span>
                    </div>
                    <div className="ride-meta-item">
                      <span className="ride-meta-label">Passageiro</span>
                      <span className="ride-meta-value">{ride.passenger_name}</span>
                    </div>
                    <div className="ride-meta-item">
                      <span className="ride-meta-label">Avaliação</span>
                      <span className="ride-meta-value">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} style={{ color: i <= Math.round(ride.rating || 5) ? '#ffc107' : '#dee2e6' }}>★</span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <nav className="bottom-nav">
        <a href="/" className="bottom-nav-item" onClick={(e) => { e.preventDefault(); navigate('/') }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="bottom-nav-label">Início</span>
        </a>
        <a href="/trips" className="bottom-nav-item active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="bottom-nav-label">Corridas</span>
        </a>
        <a href="/taxmeter" className="bottom-nav-item" onClick={(e) => { e.preventDefault(); navigate('/taxmeter') }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="4" y1="10" x2="20" y2="10" />
            <line x1="12" y1="14" x2="12" y2="18" />
          </svg>
          <span className="bottom-nav-label">Taxímetro</span>
        </a>
        <a href="/earnings" className="bottom-nav-item" onClick={(e) => { e.preventDefault(); navigate('/earnings') }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span className="bottom-nav-label">Ganhos</span>
        </a>
        <a href="/profile" className="bottom-nav-item" onClick={(e) => { e.preventDefault(); navigate('/profile') }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="bottom-nav-label">Perfil</span>
        </a>
      </nav>
    </div>
  )
}
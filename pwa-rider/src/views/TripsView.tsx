import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRidesStore } from '@/stores/rides'

export default function TripsView() {
  const ridesStore = useRidesStore()

  useEffect(() => {
    ridesStore.fetchRideHistory()
  }, [])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <h1 className="mb-4 text-xl font-bold">Histórico de viagens</h1>

      {ridesStore.rideHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
          Nenhuma viagem encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {ridesStore.rideHistory.map((trip: any) => (
            <Link
              key={trip.id}
              to={`/ride/${trip.id}`}
              className="block rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold capitalize">{trip.status}</span>
                <span className="font-bold text-blue-600">{formatCurrency(trip.fare || trip.estimated_fare)}</span>
              </div>
              <p className="text-sm text-gray-600">{trip.pickup_address || trip.origin_address}</p>
              <p className="text-sm text-gray-600">→ {trip.destination_address}</p>
            </Link>
          ))}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t bg-white">
        <Link to="/" className="text-sm text-gray-500">Início</Link>
        <Link to="/trips" className="text-sm font-semibold text-blue-600">Viagens</Link>
        <Link to="/wallet" className="text-sm text-gray-500">Carteira</Link>
        <Link to="/profile" className="text-sm text-gray-500">Perfil</Link>
      </nav>
    </div>
  )
}

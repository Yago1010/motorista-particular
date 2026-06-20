import { Link } from 'react-router-dom'
import { useRideHistoryQuery } from '@/hooks/queries/useRideQueries'
import ChamaAppShell from '@/components/ChamaAppShell'
import { Loader2 } from 'lucide-react'

export default function TripsView() {
  const { data: trips = [], isLoading } = useRideHistoryQuery()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  return (
    <ChamaAppShell title="Histórico de viagens">
      <div className="chama-shell-content">
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--chama-neon)]" />
        </div>
      ) : trips.length === 0 ? (
        <div className="chama-card p-8 text-center text-gray-400">Nenhuma viagem encontrada</div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip: any) => (
            <Link key={trip.id} to={`/ride/${trip.id}`} className="chama-card block p-4">
              <div className="mb-2 flex justify-between">
                <span className="text-sm capitalize">{trip.status || 'completed'}</span>
                <span className="font-bold text-[#39ff6a]">{formatCurrency(trip.final_fare || trip.estimated_fare)}</span>
              </div>
              <p className="text-sm text-gray-400">{trip.origin_address}</p>
              <p className="text-sm">→ {trip.destination_address}</p>
            </Link>
          ))}
        </div>
      )}
      </div>
    </ChamaAppShell>
  )
}

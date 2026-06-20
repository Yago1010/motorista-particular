import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useDriverHistoryQuery } from '@/hooks/queries/useDriverQueries'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function TripsView() {
  const navigate = useNavigate()
  const { data: rides = [], isLoading } = useDriverHistoryQuery()

  if (isLoading) return <LoadingOverlay message="Carregando histórico..." />

  return (
    <div className="chama-page min-h-screen">
      <header className="flex items-center gap-2 border-b border-white/10 p-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">Minhas corridas</h1>
      </header>

      <ScrollArea className="h-[calc(100vh-80px)] p-4">
        {rides.length === 0 ? (
          <p className="text-center text-gray-400">Nenhuma corrida ainda</p>
        ) : (
          <div className="space-y-3">
            {rides.map((ride: any) => (
              <button
                key={ride.id}
                type="button"
                onClick={() => navigate(`/ride/${ride.id}`)}
                className="chama-card w-full p-4 text-left"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">{ride.passenger_name || 'Passageiro'}</span>
                  <span className="font-bold text-[#39ff6a]">{formatCurrency(ride.final_fare || ride.estimated_fare)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-400">{ride.origin_address}</p>
                <p className="text-sm">→ {ride.destination_address}</p>
                <p className="mt-1 text-xs capitalize text-gray-500">{ride.payment_method}</p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

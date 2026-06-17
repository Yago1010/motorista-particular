import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageCircle, Navigation } from 'lucide-react'
import { useRidesStore, type Ride } from '@/stores/rides'
import DriverMapView from '@/components/DriverMapView'

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function RideDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ridesStore = useRidesStore()
  const [ride, setRide] = useState<Ride | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!id) return
    ridesStore.fetchRide(id).then((data) => {
      if (data) setRide(data)
      else if (ridesStore.currentRide) setRide(ridesStore.currentRide)
    })
  }, [id])

  const runAction = async (action: () => Promise<{ success: boolean; message?: string }>, successMsg: string) => {
    if (!id) return
    setProcessing(true)
    const result = await action()
    if (result.success) {
      toast.success(successMsg)
      const updated = await ridesStore.fetchRide(id)
      if (updated) setRide(updated)
    } else {
      toast.error(result.message || 'Erro na operação')
    }
    setProcessing(false)
  }

  const openNavigation = () => {
    if (!ride?.dest_lat || !ride?.dest_lng) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${ride.dest_lat},${ride.dest_lng}`
    window.open(url, '_blank')
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
        <DriverMapView height="100%" width="100%" showUserLocation center={[-23.5505, -46.6333]} zoom={14} />
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Embarque</p>
            <p className="text-sm font-medium">{ride.origin_address || ride.pickup_address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Destino</p>
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
            <p className="font-medium capitalize">{ride.payment_method || 'dinheiro'}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium capitalize">{ride.status}</p>
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
          <button
            type="button"
            disabled={processing}
            onClick={() => runAction(() => ridesStore.startRide(ride.id), 'Corrida iniciada!')}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white"
          >
            Iniciar Corrida
          </button>
        )}

        {(ride.status === 'started' || ride.status === 'in_progress') && (
          <button
            type="button"
            disabled={processing}
            onClick={() => runAction(() => ridesStore.arriveRide(ride.id), 'Chegada registrada!')}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
          >
            Cheguei
          </button>
        )}

        {ride.status === 'arrived' && (
          <button
            type="button"
            disabled={processing}
            onClick={() => runAction(() => ridesStore.completeRide(ride.id), 'Corrida finalizada!')}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
          >
            Finalizar Corrida
          </button>
        )}

        {['accepted', 'started', 'in_progress', 'arrived'].includes(ride.status) && (
          <button
            type="button"
            onClick={openNavigation}
            className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-medium"
          >
            <Navigation className="h-5 w-5" />
            Navegação (Maps / Waze)
          </button>
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
            Cancelar Corrida
          </button>
        )}

        {ride.status === 'completed' && (
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white"
          >
            Ver Histórico
          </button>
        )}
      </div>
    </div>
  )
}

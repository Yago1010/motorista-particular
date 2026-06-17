import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useRidesStore } from '@/stores/rides'
import RiderMapView from '@/components/RiderMapView'

export default function RideTrackingView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ridesStore = useRidesStore()
  const [ride, setRide] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (ridesStore.currentRide && String(ridesStore.currentRide.id) === String(id)) {
      setRide(ridesStore.currentRide)
      return
    }
    setRide({
      id,
      status: 'accepted',
      origin_address: 'Rua das Flores, 123',
      destination_address: 'Av. Paulista, 1000',
      estimated_fare: 31.47,
      payment_method: 'pix',
      driver: {
        first_name: 'Carlos',
        last_name: 'Silva',
        rating: 4.9,
        vehicle_model: 'Corolla',
        vehicle_plate: 'ABC-1234',
        vehicle_color: 'Prata',
      },
    })
  }, [id, ridesStore.currentRide])

  const cancelRide = async () => {
    if (!id) return
    const result = await ridesStore.cancelRide(id, 'Cancelado pelo passageiro')
    if (result.success) {
      toast.info('Corrida cancelada')
      navigate('/')
    }
  }

  const submitRating = async () => {
    if (!id || rating === 0) return
    const result = await ridesStore.rateDriver(id, rating, comment)
    if (result.success) {
      toast.success('Avaliação enviada!')
      navigate('/')
    }
  }

  if (!ride) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>
  }

  const statusLabel: Record<string, string> = {
    searching: 'Buscando motorista...',
    accepted: 'Motorista a caminho',
    started: 'Corrida em andamento',
    arrived: 'Motorista chegou',
    completed: 'Corrida finalizada',
    cancelled: 'Corrida cancelada',
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="h-56">
        <RiderMapView height="100%" width="100%" center={[-23.5505, -46.6333]} zoom={14} showUserLocation />
      </div>

      <div className="flex-1 space-y-4 p-4 pb-24">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-bold">{statusLabel[ride.status] || ride.status}</p>
        </div>

        {ride.driver && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{ride.driver.first_name} {ride.driver.last_name}</p>
                <p className="text-sm text-gray-500">
                  {ride.driver.vehicle_color} {ride.driver.vehicle_model} • {ride.driver.vehicle_plate}
                </p>
                <p className="text-sm text-yellow-600">★ {ride.driver.rating?.toFixed(1)}</p>
              </div>
              <Link to={`/chat/${ride.id}`} className="rounded-full bg-blue-600 p-2 text-white">
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Origem</p>
          <p className="mb-2">{ride.origin_address || ride.pickup_address}</p>
          <p className="text-sm text-gray-500">Destino</p>
          <p>{ride.destination_address}</p>
          <p className="mt-3 font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ride.estimated_fare || ride.fare || 0)}
          </p>
          <p className="text-sm capitalize text-gray-500">Pagamento: {ride.payment_method || 'dinheiro'}</p>
        </div>

        {ride.status === 'completed' && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="mb-2 font-semibold">Avalie o motorista</p>
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentário (opcional)"
              className="mb-3 w-full rounded-lg border p-2"
              rows={2}
            />
            <button type="button" onClick={submitRating} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">
              Enviar avaliação
            </button>
          </div>
        )}

        {!['completed', 'cancelled'].includes(ride.status) && (
          <button type="button" onClick={cancelRide} className="w-full rounded-xl border border-red-200 py-3 text-red-600">
            Cancelar corrida
          </button>
        )}
      </div>
    </div>
  )
}

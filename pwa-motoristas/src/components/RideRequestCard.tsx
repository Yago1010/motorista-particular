import type { PendingRide } from '@/stores/rides'
import { Check, X, MessageCircle } from 'lucide-react'

interface RideRequestCardProps {
  ride: PendingRide
  processing?: boolean
  onAccept: () => void
  onDecline: () => void
  onMessage?: () => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

function formatTime(seconds: number) {
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

export default function RideRequestCard({
  ride,
  processing = false,
  onAccept,
  onDecline,
  onMessage,
}: RideRequestCardProps) {
  const perKm = ride.distance > 0 ? ride.estimated_fare / (ride.distance / 1000) : 0

  return (
    <div className="rounded-t-3xl bg-[#1c2128] border border-[#30363d] p-4 shadow-2xl text-white">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-600" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wide text-gray-400">{ride.category || 'Carros'}</span>
          <p className="text-xl font-bold text-green-400">
            {formatCurrency(ride.estimated_fare)}
            <span className="ml-2 text-sm font-normal text-gray-400">
              | {formatCurrency(perKm)} / km | {ride.payment_method || 'dinheiro'}
            </span>
          </p>
        </div>
        {onMessage && (
          <button
            type="button"
            onClick={onMessage}
            className="rounded-full border border-gray-600 p-2 text-gray-300"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mb-3 text-sm capitalize text-gray-200">{ride.passenger_name}</p>

      <div className="mb-2 flex gap-3">
        <div className="mt-1 h-3 w-3 rounded-full bg-green-500" />
        <div>
          <p className="text-xs text-gray-500">Embarque</p>
          <p className="text-sm">{ride.origin_address}</p>
        </div>
      </div>

      <p className="mb-2 ml-6 text-xs text-gray-400">
        Viagem de: {formatTime(ride.estimated_duration)} ({formatDistance(ride.distance)})
      </p>

      <div className="mb-4 flex gap-3">
        <div className="mt-1 h-3 w-3 rounded-full border-2 border-red-500 bg-transparent" />
        <div>
          <p className="text-xs text-gray-500">Destino</p>
          <p className="text-sm">{ride.destination_address}</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-gray-500">
        Observações: {ride.observations || 'Nenhuma observação'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={processing}
          onClick={onDecline}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold disabled:opacity-60"
        >
          <X className="h-5 w-5" />
          Recusar
        </button>
        <button
          type="button"
          disabled={processing}
          onClick={onAccept}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold disabled:opacity-60"
        >
          <Check className="h-5 w-5" />
          Aceitar
        </button>
      </div>
    </div>
  )
}

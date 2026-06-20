import { MessageCircle, MapPin, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Ride } from '@/stores/rides'

interface DriverAssignedModalProps {
  ride: Ride
  onClose: () => void
  onCancel: () => void
}

export default function DriverAssignedModal({ ride, onClose, onCancel }: DriverAssignedModalProps) {
  const driver = ride.driver
  if (!driver) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="chama-card w-full max-w-md animate-in slide-in-from-bottom-4 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#39ff6a]">Motorista encontrado</p>
            <h2 className="text-xl font-bold">Sua corrida foi aceita</h2>
          </div>
          <button type="button" onClick={onClose} className="chama-btn-icon" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#39ff6a] text-2xl font-bold text-[#031105]">
            {driver.avatar ? (
              <img src={driver.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              driver.first_name?.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">
              {driver.first_name} {driver.last_name}
            </p>
            <p className="text-sm text-gray-400">
              {driver.vehicle_model || 'Veículo'} {driver.vehicle_plate ? `• ${driver.vehicle_plate}` : ''}
            </p>
            {driver.rating != null && <p className="text-sm text-yellow-400">★ {driver.rating.toFixed(1)}</p>}
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-xl bg-white/5 p-3 text-sm">
          <p>
            <MapPin className="mr-1 inline h-4 w-4 text-[#39ff6a]" />
            {ride.origin_address || ride.pickup_address}
          </p>
          <p className="text-gray-400">→ {ride.destination_address}</p>
          <p className="border-t border-white/10 pt-2 font-bold text-[#39ff6a]">
            {formatCurrency(ride.estimated_fare || ride.fare || 0)} • {ride.payment_method || 'cash'}
          </p>
        </div>

        <div className="flex gap-2">
          <Link to={`/chat/${ride.id}`} className="chama-btn-outline flex flex-1 items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" /> Chat
          </Link>
          <button type="button" onClick={onClose} className="chama-btn-primary flex-1">
            Ver mapa
          </button>
        </div>
        <button type="button" onClick={onCancel} className="chama-btn-outline mt-2 w-full text-red-400">
          Cancelar corrida
        </button>
      </div>
    </div>
  )
}

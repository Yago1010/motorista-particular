import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp, MessageCircle, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Ride } from '@/stores/rides'
import { useRidesStore } from '@/stores/rides'
import DriverAssignedModal from '@/components/DriverAssignedModal'
import RideInlinePayment from '@/components/RideInlinePayment'
import { resolveRideFare } from '@/utils/fareCalculator'
import { useQueryClient } from '@tanstack/react-query'
import { rideKeys } from '@/hooks/queries/useRideQueries'

const STATUS_LABEL: Record<string, string> = {
  searching: 'Procurando motorista...',
  accepted: 'Motorista a caminho do embarque',
  in_progress: 'Indo para o destino',
  started: 'Indo para o destino',
  arrived: 'Motorista chegou',
  pickup_arrived: 'Motorista no local — embarque',
  destination_arrived: 'Chegou no destino',
  completed: 'Corrida finalizada — avalie o motorista',
  cancelled: 'Cancelada',
}

interface HomeRideTrackingSheetProps {
  ride: Ride
  isSearching: boolean
  isPaid: boolean
  isCompleted: boolean
  demoEnabled?: boolean
  onCancel: () => void
  onFinished: () => void
}

export default function HomeRideTrackingSheet({
  ride,
  isSearching,
  isPaid,
  isCompleted,
  demoEnabled,
  onCancel,
  onFinished,
}: HomeRideTrackingSheetProps) {
  const ridesStore = useRidesStore()
  const qc = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [driverModalSeen, setDriverModalSeen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const completedToastRef = useRef(false)

  const displayFare = resolveRideFare(ride as Ride & { distance_km?: number; duration_min?: number })
  const needsPayment = ['destination_arrived', 'completed'].includes(ride.status || '') && !isPaid
  const canRate = isCompleted && isPaid
  const rideForPayment = { ...ride, fare: displayFare, estimated_fare: displayFare }
  const statusLabel = STATUS_LABEL[ride.status || ''] || ride.status || ''
  const canMinimize =
    !isSearching &&
    !needsPayment &&
    !canRate &&
    ['accepted', 'arrived', 'pickup_arrived', 'started', 'in_progress'].includes(ride.status || '')

  useEffect(() => {
    setMinimized(false)
  }, [ride.id])

  useEffect(() => {
    if (needsPayment || canRate) setMinimized(false)
  }, [needsPayment, canRate])

  useEffect(() => {
    if (ride.status === 'accepted' && ride.driver && !driverModalSeen) {
      setShowDriverModal(true)
      setDriverModalSeen(true)
    }
  }, [ride.status, ride.driver, driverModalSeen])

  useEffect(() => {
    completedToastRef.current = false
  }, [ride.id])

  useEffect(() => {
    if (isCompleted && isPaid && !completedToastRef.current) {
      completedToastRef.current = true
      toast.success('Motorista finalizou a corrida!')
    }
  }, [isCompleted, isPaid, ride.id])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const cancelRide = async () => {
    if (['accepted', 'started', 'in_progress', 'arrived', 'pickup_arrived'].includes(ride.status)) {
      if (!window.confirm('Cancelar agora pode gerar taxa. Deseja continuar?')) return
    }
    const result = await ridesStore.cancelRide(ride.id, 'Cancelado pelo passageiro')
    if (result.success) {
      toast.info('Corrida cancelada')
      onFinished()
    }
  }

  const closeRide = async () => {
    await ridesStore.dismissCompletedRide(ride.id)
    void qc.invalidateQueries({ queryKey: rideKeys.active })
    void qc.invalidateQueries({ queryKey: rideKeys.history })
    onFinished()
  }

  const submitRating = async () => {
    if (rating === 0) {
      toast.error('Selecione de 1 a 5 estrelas')
      return
    }
    setSubmitting(true)
    try {
      const result = await ridesStore.rateDriver(ride.id, rating, comment)
      if (result.success) {
        toast.success('Avaliação enviada!')
        void qc.invalidateQueries({ queryKey: rideKeys.active })
        void qc.invalidateQueries({ queryKey: rideKeys.history })
        onFinished()
      } else {
        toast.error(result.message || 'Erro ao avaliar')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onPaymentDone = () => {
    void qc.invalidateQueries({ queryKey: rideKeys.detail(ride.id) })
    void qc.invalidateQueries({ queryKey: rideKeys.active })
  }

  return (
    <>
      {showDriverModal && ride.driver && (
        <DriverAssignedModal
          ride={ride}
          onClose={() => setShowDriverModal(false)}
          onCancel={cancelRide}
        />
      )}

      <div
        className={`chama-offer-sheet-99 chama-home-tracking-sheet${minimized ? ' chama-home-tracking-sheet--minimized' : ''}`}
      >
        <div className="chama-offer-sheet-handle" />

        {isSearching ? (
          <div className="flex flex-col items-center px-6 py-8">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#39ff6a]/30 border-t-[#39ff6a]" />
            <h2 className="text-lg font-bold">Buscando motorista...</h2>
            <p className="mt-3 text-sm font-medium text-[#39ff6a]">
              {formatCurrency(displayFare)} • {ride.payment_method || 'cash'}
            </p>
            {demoEnabled && (
              <p className="mt-2 text-center text-xs text-gray-400">
                Demo: aceite no app motorista ou aguarde simulação automática
              </p>
            )}
            <button type="button" onClick={cancelRide} className="chama-btn-outline mt-6 w-full text-red-400">
              Cancelar busca
            </button>
          </div>
        ) : minimized ? (
          <div className="chama-tracking-minibar">
            <button type="button" className="chama-tracking-minibar-text text-left" onClick={() => setMinimized(false)}>
              <p>{statusLabel}</p>
              <small>Toque para ver detalhes • acompanhe o carro no mapa</small>
            </button>
            <button
              type="button"
              className="chama-tracking-close-btn"
              onClick={() => setMinimized(false)}
              aria-label="Expandir detalhes da corrida"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="chama-offer-sheet-scroll space-y-4 p-4">
            <div className="chama-tracking-sheet-head">
              <p className="text-lg font-bold">{statusLabel}</p>
              {canMinimize && (
                <button
                  type="button"
                  className="chama-tracking-close-btn"
                  onClick={() => setMinimized(true)}
                  aria-label="Minimizar detalhes do motorista"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {ride.driver && (
              <div className="chama-card flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#39ff6a] text-xl font-bold text-[#031105]">
                  {ride.driver.first_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold">
                    {ride.driver.first_name} {ride.driver.last_name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {ride.driver.vehicle_model || 'Veículo'} • {ride.driver.vehicle_plate || '—'}
                  </p>
                  {ride.driver.rating != null && (
                    <p className="text-xs text-yellow-400">★ {ride.driver.rating.toFixed(1)}</p>
                  )}
                </div>
                <Link to={`/chat/${ride.id}`} className="chama-btn-icon">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </div>
            )}

            <div className="chama-card p-4">
              <p className="text-xs text-gray-400">Embarque</p>
              <p className="text-sm">{ride.origin_address || ride.pickup_address}</p>
              <p className="mt-2 text-xs text-gray-400">Destino</p>
              <p className="text-sm">{ride.destination_address}</p>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
                <span className="text-lg font-bold text-[#39ff6a]">{formatCurrency(displayFare)}</span>
                <span className="text-sm capitalize">{ride.payment_method}</span>
              </div>
            </div>

            {needsPayment && <RideInlinePayment ride={rideForPayment} onPaid={onPaymentDone} />}

            {ride.status === 'destination_arrived' && isPaid && !isCompleted && (
              <div className="chama-card space-y-3 p-4 text-center">
                <div>
                  <p className="font-semibold text-[#39ff6a]">Pagamento confirmado</p>
                  <p className="mt-1 text-sm text-gray-400">Aguardando o motorista finalizar a corrida...</p>
                </div>
              </div>
            )}

            {canRate && (
              <div className="chama-card p-4">
                <p className="mb-1 font-semibold">Como foi sua corrida?</p>
                <p className="mb-3 text-sm text-gray-400">Avalie o motorista de 1 a 5 estrelas</p>
                <div className="mb-3 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrelas`}>
                      <Star
                        className={`h-9 w-9 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comentário (opcional)"
                  className="chama-input mb-3 w-full"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={submitRating}
                  disabled={rating === 0 || submitting}
                  className="chama-btn-primary mb-2 w-full"
                >
                  {submitting ? 'Enviando...' : 'Enviar avaliação e finalizar'}
                </button>
                <button type="button" onClick={closeRide} className="chama-btn-outline w-full">
                  Concluir sem avaliar
                </button>
              </div>
            )}

            {!['completed', 'cancelled', 'searching', 'destination_arrived'].includes(ride.status) && (
              <button type="button" onClick={cancelRide} className="chama-btn-outline w-full text-red-400">
                Cancelar corrida
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

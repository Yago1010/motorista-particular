import { useEffect, useState } from 'react'
import { Banknote, Copy, CreditCard, MessageCircle, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { usePayRideMutation, fetchRidePaymentPix } from '@/hooks/queries/useRideQueries'
import { useWalletQuery } from '@/hooks/queries/useWalletQueries'
import { buildPixQrUrl, buildWhatsAppDriverLink } from '@/utils/rideSimulation'
import { isDemoRideId } from '@/utils/demoRideBridge'
import type { Ride } from '@/stores/rides'
import { Link } from 'react-router-dom'

const methods = [
  { id: 'cash', label: 'Dinheiro', icon: Banknote },
  { id: 'pix', label: 'Pix / QR Code', icon: CreditCard },
  { id: 'wallet', label: 'Carteira', icon: Wallet },
]

interface RideInlinePaymentProps {
  ride: Ride
  onPaid: () => void
}

export default function RideInlinePayment({ ride, onPaid }: RideInlinePaymentProps) {
  const { data: wallet, refetch: refetchWallet } = useWalletQuery()
  const payMutation = usePayRideMutation()
  const [selected, setSelected] = useState(ride.payment_method || 'cash')
  const [pixCode, setPixCode] = useState('')
  const [pixQrUrl, setPixQrUrl] = useState('')
  const [pixLoading, setPixLoading] = useState(false)

  const fare = ride.fare || ride.estimated_fare || 0
  const driverPhone = ride.driver?.phone
  const driverName = ride.driver
    ? `${ride.driver.first_name || ''} ${ride.driver.last_name || ''}`.trim()
    : 'Motorista'

  useEffect(() => {
    refetchWallet()
  }, [refetchWallet])

  useEffect(() => {
    if (selected !== 'pix') return
    setPixLoading(true)
    fetchRidePaymentPix(ride.id)
      .then((data) => {
        setPixCode(data.pix_code)
        if (data.qr_url) setPixQrUrl(data.qr_url)
      })
      .catch(() => toast.error('Não foi possível gerar o Pix'))
      .finally(() => setPixLoading(false))
  }, [selected, ride.id])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handlePay = async () => {
    if (selected === 'wallet' && wallet && wallet.balance < fare) {
      toast.error('Saldo insuficiente — adicione crédito na carteira')
      return
    }
    try {
      await payMutation.mutateAsync({ rideId: ride.id, payment_method: selected })
      toast.success('Pagamento confirmado!')
      onPaid()
    } catch {
      toast.error('Erro ao processar pagamento')
    }
  }

  const copyPix = async () => {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      toast.success('Código Pix copiado!')
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  const shareWhatsApp = () => {
    const phone = driverPhone || (isDemoRideId(ride.id) ? '+5511999990002' : '')
    if (!phone) {
      toast.error('Telefone do motorista indisponível')
      return
    }
    const msg =
      selected === 'pix' && pixCode
        ? `Olá ${driverName}! Pagamento corrida #${ride.id} — ${formatCurrency(fare)} via Pix.\n\n${pixCode}`
        : `Olá ${driverName}! Confirmo pagamento da corrida #${ride.id}: ${formatCurrency(fare)}`
    window.open(buildWhatsAppDriverLink(phone, msg), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="chama-card space-y-3 p-4">
      <p className="font-semibold">Pagamento da corrida</p>
      <p className="text-2xl font-black text-[#39ff6a]">{formatCurrency(fare)}</p>
      {wallet != null && (
        <p className="text-xs text-gray-400">
          Saldo carteira: {formatCurrency(wallet.balance)}{' '}
          <Link to="/wallet" className="text-[#39ff6a] underline">
            Adicionar saldo
          </Link>
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {methods.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(id)}
            className={`rounded-xl border p-2 text-center text-xs ${selected === id ? 'border-[#39ff6a] bg-[#39ff6a]/10' : 'border-white/10'}`}
          >
            <Icon className="mx-auto mb-1 h-5 w-5 text-[#39ff6a]" />
            {label}
          </button>
        ))}
      </div>

      {selected === 'pix' && (
        <div className="rounded-xl bg-black/20 p-3 text-center">
          {pixLoading ? (
            <div className="mx-auto h-40 w-40 animate-pulse rounded-xl bg-white/10" />
          ) : pixCode ? (
            <img
              src={pixQrUrl || buildPixQrUrl(pixCode, 180)}
              alt="QR Pix"
              className="mx-auto mb-2 rounded-lg bg-white p-2"
              width={180}
              height={180}
            />
          ) : null}
          {pixCode && (
            <>
              <p className="mb-2 break-all text-[10px] text-gray-400">{pixCode}</p>
              <button type="button" onClick={copyPix} className="chama-btn-outline inline-flex items-center gap-1 px-3 py-1 text-xs">
                <Copy className="h-3 w-3" />
                Copiar Pix
              </button>
            </>
          )}
        </div>
      )}

      {(driverPhone || isDemoRideId(ride.id)) && (
        <button type="button" onClick={shareWhatsApp} className="chama-btn-outline flex w-full items-center justify-center gap-2 py-2 text-sm">
          <MessageCircle className="h-4 w-4" />
          WhatsApp do motorista
        </button>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={payMutation.isPending || (selected === 'pix' && pixLoading)}
        className="chama-btn-primary w-full"
      >
        {payMutation.isPending
          ? 'Processando...'
          : selected === 'cash'
            ? 'Confirmar pagamento em dinheiro'
            : selected === 'pix'
              ? 'Já paguei via Pix'
              : 'Pagar com carteira'}
      </button>
    </div>
  )
}

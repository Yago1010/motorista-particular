import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Copy, CreditCard, MessageCircle, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useRideQuery, usePayRideMutation, fetchRidePaymentPix } from '@/hooks/queries/useRideQueries'
import { useWalletQuery } from '@/hooks/queries/useWalletQueries'
import LoadingOverlay from '@/components/LoadingOverlay'
import { buildPixQrUrl, buildWhatsAppDriverLink } from '@/utils/rideSimulation'

const methods = [
  { id: 'cash', label: 'Dinheiro', icon: Banknote, desc: 'Pague ao motorista' },
  { id: 'pix', label: 'Pix', icon: CreditCard, desc: 'QR Code ou copia e cola' },
  { id: 'wallet', label: 'Carteira', icon: Wallet, desc: 'Saldo Chama no 12' },
  { id: 'card', label: 'Cartão', icon: CreditCard, desc: 'Cartão salvo' },
]

export default function PaymentView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: ride, isLoading } = useRideQuery(id)
  const { data: wallet } = useWalletQuery()
  const payMutation = usePayRideMutation()
  const [selected, setSelected] = useState('cash')
  const [pixCode, setPixCode] = useState('')
  const [pixLoading, setPixLoading] = useState(false)

  const fare = ride?.fare || ride?.estimated_fare || 0
  const driverPhone = ride?.driver?.phone
  const driverName = ride?.driver
    ? `${ride.driver.first_name || ''} ${ride.driver.last_name || ''}`.trim()
    : 'Motorista'

  useEffect(() => {
    if (selected !== 'pix' || !id) return
    setPixLoading(true)
    fetchRidePaymentPix(id)
      .then((data) => setPixCode(data.pix_code))
      .catch(() => toast.error('Não foi possível gerar o Pix'))
      .finally(() => setPixLoading(false))
  }, [selected, id])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handlePay = async () => {
    if (!id) return
    try {
      await payMutation.mutateAsync({ rideId: id, payment_method: selected })
      toast.success('Pagamento confirmado!')
      navigate(`/ride/${id}`, { replace: true })
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
    if (!driverPhone) {
      toast.error('Telefone do motorista indisponível')
      return
    }
    const msg = `Olá ${driverName}! Segue pagamento da corrida #${id} no valor de ${formatCurrency(fare)} via ${selected === 'pix' ? 'Pix' : selected}.`
    window.open(buildWhatsAppDriverLink(driverPhone, msg), '_blank', 'noopener,noreferrer')
  }

  if (isLoading || !ride) return <LoadingOverlay message="Carregando pagamento..." />

  return (
    <div className="chama-page min-h-screen p-4 pb-10">
      <header className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="chama-map-back static">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Pagamento</h1>
      </header>

      <div className="chama-card mb-6 p-6 text-center">
        <p className="text-sm text-gray-400">Total da corrida</p>
        <p className="text-3xl font-black text-[#39ff6a]">{formatCurrency(fare)}</p>
        {wallet && (
          <p className="mt-2 text-sm text-gray-400">Saldo carteira: {formatCurrency(wallet.balance)}</p>
        )}
      </div>

      <p className="mb-3 text-sm font-semibold text-gray-400">Forma de pagamento</p>
      <div className="space-y-2">
        {methods.map(({ id: methodId, label, icon: Icon, desc }) => (
          <button
            key={methodId}
            type="button"
            onClick={() => setSelected(methodId)}
            className={`chama-card flex w-full items-center gap-3 p-4 text-left ${selected === methodId ? 'ring-2 ring-[#39ff6a]' : ''}`}
          >
            <Icon className="h-6 w-6 text-[#39ff6a]" />
            <div className="flex-1">
              <p className="font-bold">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 ${selected === methodId ? 'border-[#39ff6a] bg-[#39ff6a]' : 'border-gray-600'}`} />
          </button>
        ))}
      </div>

      {selected === 'pix' && (
        <div className="chama-card chama-payment-pix mt-4 p-4 text-center">
          <p className="mb-3 text-sm font-semibold">Escaneie o QR Code Pix</p>
          {pixLoading ? (
            <div className="mx-auto mb-3 h-48 w-48 animate-pulse rounded-xl bg-white/10" />
          ) : pixCode ? (
            <img
              src={buildPixQrUrl(pixCode, 220)}
              alt="QR Code Pix"
              className="mx-auto mb-3 rounded-xl bg-white p-2"
              width={220}
              height={220}
            />
          ) : null}
          {pixCode && (
            <>
              <p className="mb-2 break-all rounded-lg bg-black/30 p-2 text-xs text-gray-300">{pixCode}</p>
              <button type="button" onClick={copyPix} className="chama-btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm">
                <Copy className="h-4 w-4" />
                Copiar código Pix
              </button>
            </>
          )}
        </div>
      )}

      {driverPhone && (
        <button
          type="button"
          onClick={shareWhatsApp}
          className="chama-btn-outline mt-4 flex w-full items-center justify-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Enviar valor no WhatsApp do motorista
        </button>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={payMutation.isPending || (selected === 'pix' && pixLoading)}
        className="chama-btn-primary mt-6 w-full"
      >
        {payMutation.isPending
          ? 'Processando...'
          : selected === 'cash'
            ? 'Confirmar pagamento em dinheiro'
            : selected === 'pix'
              ? 'Já paguei via Pix'
              : 'Confirmar pagamento'}
      </button>
    </div>
  )
}

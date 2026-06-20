import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  Loader2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/services/api'
import { normalizeWalletTransaction } from '@/utils/walletTx'
import { useWalletStore } from '@/stores/wallet'
import { useEarningsStore } from '@/stores/earnings'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function WalletView() {
  const navigate = useNavigate()
  const walletStore = useWalletStore()
  const { totalEarnings } = useEarningsStore()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPixKey, setWithdrawPixKey] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  const balance = walletStore.wallet?.balance ?? 0
  const pendingBalance = walletStore.wallet?.pending_balance ?? 0
  const transactions = walletStore.wallet?.transactions ?? []

  const filtered = useMemo(
    () =>
      transactions
        .filter((tx) => filter === 'all' || tx.type === filter)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [transactions, filter]
  )

  useEffect(() => {
    api
      .get('driver/wallet')
      .then((res) => {
        const data = res.data
        walletStore.setWallet({
          ...data,
          transactions: (data.transactions || []).map(normalizeWalletTransaction),
        })
      })
      .catch(() =>
        walletStore.setWallet({ balance: 0, pending_balance: 0, transactions: [] })
      )
      .finally(() => setLoading(false))
  }, [walletStore])

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount.replace(',', '.'))
    if (!amount || amount <= 0 || amount > balance) {
      toast.error('Valor inválido ou saldo insuficiente')
      return
    }
    if (!withdrawPixKey.trim()) {
      toast.error('Informe a chave Pix')
      return
    }
    setWithdrawing(true)
    try {
      await api.post('driver/wallet/withdraw', {
        amount,
        method: 'pix',
        pix_key: withdrawPixKey.trim(),
      })
      toast.success('Saque solicitado! Processamento em até 1 dia útil.')
      setShowWithdraw(false)
      setWithdrawAmount('')
      setWithdrawPixKey('')
      const res = await api.get('driver/wallet')
      const data = res.data
      walletStore.setWallet({
        ...data,
        transactions: (data.transactions || []).map(normalizeWalletTransaction),
      })
    } catch {
      toast.error('Erro ao solicitar saque')
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="wallet-99 flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--chama-neon)]" />
      </div>
    )
  }

  return (
    <div className="wallet-99 chama-shell-content">
      <button
        type="button"
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-[var(--chama-muted)]"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft size={18} />
        Voltar
      </button>

      <div className="wallet-99-hero">
        <p className="wallet-99-hero-label">Saldo disponível</p>
        <p className="wallet-99-hero-balance">{formatCurrency(balance)}</p>
        <div className="wallet-99-hero-actions">
          <button
            type="button"
            className="chama-btn-primary"
            disabled={balance <= 0}
            onClick={() => setShowWithdraw(true)}
          >
            Sacar via Pix
          </button>
          <button type="button" className="chama-btn-outline" onClick={() => navigate('/earnings')}>
            Ver ganhos
          </button>
        </div>
      </div>

      <div className="wallet-99-stats">
        <div className="chama-card wallet-99-stat">
          <p className="wallet-99-stat-value">{formatCurrency(pendingBalance)}</p>
          <p className="wallet-99-stat-label">Pendente</p>
        </div>
        <div className="chama-card wallet-99-stat">
          <p className="wallet-99-stat-value">{formatCurrency(totalEarnings)}</p>
          <p className="wallet-99-stat-label">Total ganho</p>
        </div>
      </div>

      <div className="wallet-99-filters">
        {(['all', 'credit', 'debit'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`wallet-99-filter${filter === key ? ' wallet-99-filter--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'Todos' : key === 'credit' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="chama-card wallet-99-tx" style={{ justifyContent: 'center' }}>
          <Wallet size={20} className="opacity-50" />
          <span className="text-sm text-[var(--chama-muted)]">Nenhuma movimentação</span>
        </div>
      ) : (
        filtered.map((tx) => (
          <div key={tx.id} className="chama-card wallet-99-tx">
            <div
              className={`wallet-99-tx-icon wallet-99-tx-icon--${tx.type === 'credit' ? 'credit' : 'debit'}`}
            >
              {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div className="wallet-99-tx-body">
              <p className="wallet-99-tx-title">{tx.description || 'Movimentação'}</p>
              <p className="wallet-99-tx-date">{formatDate(tx.created_at)}</p>
            </div>
            <p
              className={`wallet-99-tx-amount wallet-99-tx-amount--${tx.type === 'credit' ? 'credit' : 'debit'}`}
            >
              {tx.type === 'credit' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </p>
          </div>
        ))
      )}

      {showWithdraw && (
        <div className="wallet-99-modal-backdrop" onClick={() => setShowWithdraw(false)}>
          <div className="wallet-99-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Sacar saldo</h2>
            <p className="taximeter-meta mb-3">
              Disponível: <strong>{formatCurrency(balance)}</strong>
            </p>
            <label className="taximeter-field">
              <span>Valor (R$)</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={balance}
                className="chama-input"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0,00"
              />
            </label>
            <div className="wallet-99-quick">
              {[20, 50, 100, 200].map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={v > balance}
                  onClick={() => setWithdrawAmount(String(v))}
                >
                  R$ {v}
                </button>
              ))}
            </div>
            <label className="taximeter-field mt-3">
              <span>Chave Pix</span>
              <input
                type="text"
                className="chama-input"
                value={withdrawPixKey}
                onChange={(e) => setWithdrawPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone..."
              />
            </label>
            <div className="wallet-99-modal-actions">
              <button type="button" className="chama-btn-outline" onClick={() => setShowWithdraw(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="chama-btn-primary"
                disabled={withdrawing}
                onClick={handleWithdraw}
              >
                {withdrawing ? 'Enviando...' : 'Confirmar saque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

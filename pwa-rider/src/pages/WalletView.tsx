import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Copy, Loader2, Plus, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import ChamaAppShell from '@/components/ChamaAppShell'
import {
  useWalletQuery,
  useWalletTransactionsQuery,
  useAddFundsMutation,
} from '@/hooks/queries/useWalletQueries'

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
  const { data: wallet, isLoading: walletLoading } = useWalletQuery()
  const { data: transactions = [], isLoading: txLoading } = useWalletTransactionsQuery()
  const addFunds = useAddFundsMutation()
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixCode, setPixCode] = useState('')

  const balance = wallet?.balance ?? 0
  const pending = wallet?.pending ?? 0

  const filtered = transactions
    .filter((tx: { type: string }) => filter === 'all' || tx.type === filter)
    .sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const handleAddFunds = async () => {
    const value = parseFloat(amount.replace(',', '.'))
    if (!value || value <= 0) {
      toast.error('Informe um valor válido')
      return
    }
    try {
      const result = await addFunds.mutateAsync(value)
      setPixCode(result.pix_code || 'PIX-CHAMA-' + value.toFixed(2).replace('.', ''))
      toast.success('Pix gerado! Confirme o pagamento.')
    } catch {
      toast.error('Erro ao gerar Pix')
    }
  }

  const copyPix = () => {
    if (!pixCode) return
    navigator.clipboard.writeText(pixCode).then(() => toast.success('Código copiado'))
  }

  if (walletLoading) {
    return (
      <ChamaAppShell title="Carteira">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--chama-neon)]" />
        </div>
      </ChamaAppShell>
    )
  }

  return (
    <ChamaAppShell title="Carteira">
      <div className="wallet-99">
        <div className="wallet-99-hero">
          <p className="wallet-99-hero-label">Saldo na carteira</p>
          <p className="wallet-99-hero-balance">{formatCurrency(balance)}</p>
          <div className="wallet-99-hero-actions">
            <button type="button" className="chama-btn-primary" onClick={() => setShowAddFunds(true)}>
              <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Adicionar crédito
            </button>
          </div>
        </div>

        <div className="wallet-99-stats">
          <div className="chama-card wallet-99-stat">
            <p className="wallet-99-stat-value">{formatCurrency(pending)}</p>
            <p className="wallet-99-stat-label">Pendente</p>
          </div>
          <div className="chama-card wallet-99-stat">
            <p className="wallet-99-stat-value">{filtered.length}</p>
            <p className="wallet-99-stat-label">Movimentações</p>
          </div>
        </div>

        <p className="taximeter-section-title">Formas de pagamento</p>
        <div className="wallet-99-filters mb-3">
          {['Dinheiro', 'Pix', 'Carteira', 'Cartão'].map((label) => (
            <span
              key={label}
              className="wallet-99-filter wallet-99-filter--active"
              style={{ cursor: 'default', flex: 'unset', padding: '0.45rem 0.75rem' }}
            >
              {label}
            </span>
          ))}
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

        {txLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--chama-neon)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="chama-card wallet-99-tx" style={{ justifyContent: 'center' }}>
            <Wallet size={20} className="opacity-50" />
            <span className="text-sm text-[var(--chama-muted)]">Nenhuma transação ainda</span>
          </div>
        ) : (
          filtered.map((tx: { id: number; type: string; description: string; amount: number; created_at: string }) => (
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
      </div>

      {showAddFunds && (
        <div className="wallet-99-modal-backdrop" onClick={() => setShowAddFunds(false)}>
          <div className="wallet-99-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Recarga via Pix</h2>
            <label className="taximeter-field">
              <span>Valor (R$)</span>
              <input
                type="number"
                step="0.01"
                min="5"
                className="chama-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 50,00"
              />
            </label>
            <div className="wallet-99-quick">
              {[20, 50, 100, 200].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}>
                  R$ {v}
                </button>
              ))}
            </div>
            {pixCode && (
              <div className="chama-card mt-3 p-3">
                <p className="taximeter-meta mb-2">Copie o código Pix:</p>
                <p className="break-all text-xs">{pixCode}</p>
                <button type="button" className="chama-btn-outline mt-2 w-full" onClick={copyPix}>
                  <Copy size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Copiar código
                </button>
              </div>
            )}
            <div className="wallet-99-modal-actions">
              <button type="button" className="chama-btn-outline" onClick={() => setShowAddFunds(false)}>
                Fechar
              </button>
              <button
                type="button"
                className="chama-btn-primary"
                disabled={addFunds.isPending}
                onClick={handleAddFunds}
              >
                {addFunds.isPending ? 'Gerando...' : 'Gerar Pix'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ChamaAppShell>
  )
}

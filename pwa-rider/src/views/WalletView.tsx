import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import BalanceBar from '@/components/BalanceBar'

interface Transaction {
  id: number
  type: 'credit' | 'debit'
  description: string
  amount: number
  status: string
  created_at: string
}

export default function WalletView() {
  const authStore = useAuthStore()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    setBalance(authStore.user?.wallet_balance || 128.4)
    setTransactions([
      { id: 1, type: 'credit', description: 'Recarga Pix', amount: 50, status: 'completed', created_at: new Date().toISOString() },
      { id: 2, type: 'debit', description: 'Corrida finalizada', amount: 18.9, status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString() },
    ])
  }, [authStore.user])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Carteira</h1>
      </header>

      <BalanceBar balance={balance} className="mb-6" />

      <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Saldo disponível</p>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(balance)}</p>
        <button type="button" className="mt-3 w-full rounded-xl bg-green-600 py-3 font-semibold text-white">
          Adicionar crédito (Pix)
        </button>
      </div>

      <h2 className="mb-3 font-semibold">Histórico</h2>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <p className="font-medium">{tx.description}</p>
              <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t bg-white">
        <Link to="/" className="text-sm text-gray-500">Início</Link>
        <Link to="/trips" className="text-sm text-gray-500">Viagens</Link>
        <Link to="/wallet" className="text-sm font-semibold text-blue-600">Carteira</Link>
        <Link to="/profile" className="text-sm text-gray-500">Perfil</Link>
      </nav>
    </div>
  )
}

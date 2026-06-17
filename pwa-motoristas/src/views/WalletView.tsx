import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, TrendingUp, Banknote, CreditCard, Plus, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useWalletStore } from '@/stores/wallet'
import { useEarningsStore } from '@/stores/earnings'
import { useToastStore } from '@/stores/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const formatDate = (dateStr: string) => format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR })

export default function WalletView() {
  const navigate = useNavigate()
  const { wallet, loading: walletStoreLoading, addTransaction } = useWalletStore()
  const { totalEarnings } = useEarningsStore()
  const { success, error } = useToastStore()

  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'pix'>('pix')
  const [withdrawPixKey, setWithdrawPixKey] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({ bank_name: '', account_type: '', account_number: '', agency: '', is_default: false })
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  const balance = wallet?.balance || 0
  const pendingBalance = wallet?.pending_balance || 0
  const transactions = wallet?.transactions || []

  const filteredTransactions = transactions
    .filter((tx: any) => filterType === 'all' || tx.type === filterType)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const loadTransactions = async () => {
    setTransactionsLoading(true)
    try {
      // Transactions are already loaded from store
    } finally {
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0 || amount > balance) return
    setIsWithdrawing(true)
    try {
      // Simulate withdraw - in real app would call API
      addTransaction({
        id: Date.now(),
        type: 'debit',
        amount,
        description: `Saque via ${withdrawMethod === 'pix' ? 'PIX' : 'conta bancária'}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      })
      setShowWithdraw(false)
      setWithdrawAmount('')
      setWithdrawPixKey('')
      success('Saque solicitado!')
    } catch (err) {
      error('Erro ao solicitar saque')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const addBankAccount = async () => {
    if (!newAccount.bank_name || !newAccount.account_number) return
    // Add bank account logic here
    setShowAddAccount(false)
    setNewAccount({ bank_name: '', account_type: '', account_number: '', agency: '', is_default: false })
    success('Conta adicionada!')
  }

  const quickAmounts = [10, 20, 50, 100, 200]

  return (
    <div className="screen active">
      <header className="screen-header">
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="screen-title">Carteira</h1>
        <div />
      </header>

      <div className="screen-content">
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none">
          <CardContent className="p-6 text-center">
            <div className="text-sm uppercase tracking-wider opacity-90 mb-1">Saldo Disponível</div>
            <div className="text-4xl font-bold mb-4">{formatCurrency(balance)}</div>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30" onClick={() => navigate('/earnings')}>
                Ver Ganhos
              </Button>
              <Button onClick={() => setShowWithdraw(true)} disabled={balance <= 0} className="bg-white text-emerald-600 hover:bg-white/90">
                Sacar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(pendingBalance)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Pendente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalEarnings)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Ganho</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <CardTitle>Extrato</CardTitle>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'credit' | 'debit')}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="credit">Créditos</SelectItem>
                  <SelectItem value="debit">Débitos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsLoading && (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            )}
            {filteredTransactions.length === 0 && !transactionsLoading && (
              <div className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada</div>
            )}
            {filteredTransactions.length > 0 && !transactionsLoading && (
              <ScrollArea className="max-h-96">
                <div className="space-y-0">
                  {filteredTransactions.map((tx: any) => (
                    <div key={tx.id} className="transaction-item p-4 border-b border-border/50 last:border-0 flex items-center gap-3">
                      <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
                        {tx.type === 'credit' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingUp className="w-5 h-5 rotate-180" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.created_at)} {tx.ride_id ? '· Corrida #' + tx.ride_id : ''}</div>
                      </div>
                      <div className={clsx('font-semibold text-sm', tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600')}>
                        {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas Bancárias</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setShowAddAccount(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </CardContent>
        </Card>

        {showWithdraw && (
          <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Sacar Saldo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(balance)}</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-emerald-50">
                    <input type="radio" name="withdrawMethod" checked={withdrawMethod === 'pix'} onChange={() => setWithdrawMethod('pix')} className="text-emerald-600" />
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">PIX (instantâneo)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-emerald-50">
                    <input type="radio" name="withdrawMethod" checked={withdrawMethod === 'bank'} onChange={() => setWithdrawMethod('bank')} className="text-emerald-600" />
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Conta bancária (1 dia útil)</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      max={balance}
                      value={withdrawAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawAmount(e.target.value)}
                      placeholder="0,00"
                      className="pl-8 text-xl text-center"
                    />
                  </div>
                </div>

                {withdrawMethod === 'pix' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Chave PIX</label>
                    <Input
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                      value={withdrawPixKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawPixKey(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map(amt => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[60px]"
                      onClick={() => setWithdrawAmount(amt.toString())}
                      disabled={amt > balance}
                    >
                      R$ {amt}
                    </Button>
                  ))}
                </div>

                <DialogFooter>
                  <Button variant="outline" className="flex-1" onClick={() => setShowWithdraw(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleWithdraw} disabled={isWithdrawing || walletStoreLoading || !withdrawAmount || parseFloat(withdrawAmount) > balance || (withdrawMethod === 'pix' && !withdrawPixKey)}>
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Sacar R$ ${parseFloat(withdrawAmount || '0').toFixed(2)}`
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {showAddAccount && (
          <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Adicionar Conta Bancária</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nome do banco" value={newAccount.bank_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAccount({...newAccount, bank_name: e.target.value})} />
                <Select value={newAccount.account_type} onValueChange={(v: string) => setNewAccount({...newAccount, account_type: v})}>
                  <SelectTrigger><SelectValue placeholder="Tipo de conta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Agência" value={newAccount.agency} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAccount({...newAccount, agency: e.target.value})} />
                <Input placeholder="Número da conta" value={newAccount.account_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAccount({...newAccount, account_number: e.target.value})} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newAccount.is_default} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAccount({...newAccount, is_default: e.target.checked})} className="rounded" />
                  <span className="text-sm">Definir como principal</span>
                </label>
                <DialogFooter>
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddAccount(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={addBankAccount}>Salvar</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
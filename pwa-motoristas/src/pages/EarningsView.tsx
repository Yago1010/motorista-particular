import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Calendar, Loader2, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/services/api'

interface EarningsSummary {
  total: number
  week: number
  today: number
  rides_count: number
  total_distance: number
  available_balance: number
}

interface EarningsDetail {
  id: number
  date: string
  rides_count: number
  distance: number
  amount: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export default function EarningsView() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [details, setDetails] = useState<EarningsDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    loadEarnings()
  }, [filterPeriod])

  async function loadEarnings() {
    setLoading(true)
    try {
      const [summaryRes, detailsRes] = await Promise.all([
        api.get('driver/earnings/summary'),
        api.get('driver/earnings/details', { params: { period: filterPeriod } }),
      ])
      setSummary(summaryRes.data)
      const rows = Array.isArray(detailsRes.data) ? detailsRes.data : []
      setDetails(rows)
    } catch {
      toast.error('Erro ao carregar relatório')
      setSummary(null)
      setDetails([])
    } finally {
      setLoading(false)
    }
  }

  if (loading && !summary) {
    return (
      <div className="wallet-99 flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--chama-neon)]" />
      </div>
    )
  }

  const s = summary || {
    total: 0,
    week: 0,
    today: 0,
    rides_count: 0,
    total_distance: 0,
    available_balance: 0,
  }

  return (
    <div className="wallet-99 chama-shell-content">
      <div className="wallet-99-hero">
        <p className="wallet-99-hero-label">Ganhos totais</p>
        <p className="wallet-99-hero-balance">{formatCurrency(s.total)}</p>
        <div className="wallet-99-hero-actions">
          <button type="button" className="chama-btn-primary" onClick={() => navigate('/wallet')}>
            <Wallet size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Carteira digital
          </button>
        </div>
      </div>

      <div className="wallet-99-stats">
        <div className="chama-card wallet-99-stat">
          <p className="wallet-99-stat-value">{formatCurrency(s.today)}</p>
          <p className="wallet-99-stat-label">Hoje</p>
        </div>
        <div className="chama-card wallet-99-stat">
          <p className="wallet-99-stat-value">{formatCurrency(s.week)}</p>
          <p className="wallet-99-stat-label">Esta semana</p>
        </div>
        <div className="chama-card wallet-99-stat">
          <p className="wallet-99-stat-value">{s.rides_count}</p>
          <p className="wallet-99-stat-label">Corridas</p>
        </div>
        <div className="chama-card wallet-99-stat">
          <p className="wallet-99-stat-value">{(s.total_distance / 1000).toFixed(1)} km</p>
          <p className="wallet-99-stat-label">Distância</p>
        </div>
      </div>

      <p className="taximeter-section-title">Histórico por dia</p>

      <div className="wallet-99-filters mb-3">
        {(['week', 'month', 'year'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`wallet-99-filter${filterPeriod === key ? ' wallet-99-filter--active' : ''}`}
            onClick={() => setFilterPeriod(key)}
          >
            {key === 'week' ? '7 dias' : key === 'month' ? '30 dias' : '1 ano'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--chama-neon)]" />
        </div>
      ) : details.length === 0 ? (
        <div className="chama-card taximeter-empty">
          <BarChart3 size={32} className="taximeter-empty-icon" />
          <p>Nenhum ganho neste período.</p>
          <p className="taximeter-meta">Complete corridas pelo app para ver aqui.</p>
        </div>
      ) : (
        <ul className="taximeter-trip-list">
          {details.map((item) => (
            <li key={item.id} className="chama-card taximeter-trip-item">
              <div>
                <p className="taximeter-trip-cat">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {formatDate(item.date)}
                </p>
                <p className="taximeter-meta">
                  {item.rides_count} corrida(s) · {(item.distance / 1000).toFixed(1)} km
                </p>
              </div>
              <p className="taximeter-trip-fare">{formatCurrency(item.amount)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="chama-card mt-4 p-4 flex items-center gap-3">
        <TrendingUp className="text-[var(--chama-neon)]" size={22} />
        <div>
          <p className="text-sm font-semibold">Saldo na carteira</p>
          <p className="taximeter-meta">{formatCurrency(s.available_balance)} disponível para saque</p>
        </div>
      </div>
    </div>
  )
}

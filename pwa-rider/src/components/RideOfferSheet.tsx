import type { ReactNode } from 'react'
import { formatDistance, formatDuration } from '@/utils/navigation'

export interface RideCategoryOffer {
  id: number
  name: string
  color: string
  icon: string
  description: string
  fare: number
  estimatedPrice: string
}

interface RideOfferSheetProps {
  categories: RideCategoryOffer[]
  selectedCategory: string
  onSelectCategory: (name: string) => void
  routeDistance: number | null
  routeDuration: number | null
  routeLoading: boolean
  fareLoading: boolean
  paymentMethod: string
  onPaymentChange: (method: string) => void
  hasCard: boolean
  promo?: ReactNode
  onConfirm?: () => void
  confirmDisabled?: boolean
  confirming?: boolean
  confirmLabel?: string
}

export default function RideOfferSheet({
  categories,
  selectedCategory,
  onSelectCategory,
  routeDistance,
  routeDuration,
  routeLoading,
  fareLoading,
  paymentMethod,
  onPaymentChange,
  hasCard,
  promo,
  onConfirm,
  confirmDisabled,
  confirming,
  confirmLabel,
}: RideOfferSheetProps) {
  const priceLoading = routeLoading || fareLoading
  const selected = categories.find((c) => c.name === selectedCategory)

  return (
    <div className="chama-offer-sheet-99">
      <div className="chama-offer-sheet-handle" />

      <div className="chama-offer-sheet-head">
        <p className="chama-offer-kicker">Sua corrida</p>
        {routeDistance != null && routeDuration != null ? (
          <p className="chama-offer-meta">
            {formatDistance(routeDistance)} · {formatDuration(routeDuration)}
          </p>
        ) : (
          <p className="chama-offer-meta">{routeLoading ? 'Calculando rota...' : 'Aguardando rota'}</p>
        )}
      </div>

      <div className="chama-cat-scroll" role="listbox" aria-label="Categorias">
        {categories.map((cat) => {
          const selected = selectedCategory === cat.name
          return (
            <button
              key={cat.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`chama-cat-card-99${selected ? ' selected' : ''}`}
              onClick={() => onSelectCategory(cat.name)}
            >
              <span className="chama-cat-card-99-icon" style={{ background: cat.color }}>
                {cat.icon}
              </span>
              <span className="chama-cat-card-99-name">{cat.name}</span>
              <span className="chama-cat-card-99-price">
                {priceLoading ? '...' : cat.estimatedPrice}
              </span>
              {routeDuration != null && (
                <span className="chama-cat-card-99-eta">{formatDuration(routeDuration)}</span>
              )}
            </button>
          )
        })}
      </div>

      {promo ? <div className="chama-offer-promo">{promo}</div> : null}

      <div className="chama-offer-payment">
        <label className="chama-offer-payment-label" htmlFor="payment-method">
          Pagamento
        </label>
        <select
          id="payment-method"
          className="chama-offer-payment-select"
          value={paymentMethod}
          onChange={(e) => onPaymentChange(e.target.value)}
        >
          <option value="cash">Dinheiro</option>
          <option value="pix">Pix</option>
          {hasCard && <option value="card">Cartão</option>}
          <option value="wallet">Carteira</option>
        </select>
      </div>

      {onConfirm && (
        <button
          type="button"
          className="chama-btn-confirm-route chama-offer-confirm-btn"
          onClick={onConfirm}
          disabled={confirmDisabled || priceLoading || confirming}
        >
          <span>{confirming ? 'Chamando motorista...' : confirmLabel ?? `Chamar ${selectedCategory}`}</span>
          <strong>{priceLoading || !selected ? '—' : selected.estimatedPrice}</strong>
        </button>
      )}
    </div>
  )
}

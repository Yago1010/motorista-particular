import type { ReactNode } from 'react'
import { MapPin, Navigation, X, ArrowUpDown } from 'lucide-react'
import { formatPlaceDistance } from '@/utils/navigation'

export interface PlaceSuggestion {
  lat: number
  lng: number
  address: string
  distance_m?: number
}

interface RouteSearchBarProps {
  originInput: string
  destinationInput: string
  originFocused: boolean
  destFocused: boolean
  originSuggestions: PlaceSuggestion[]
  destSuggestions: PlaceSuggestion[]
  onOriginChange: (value: string) => void
  onDestinationChange: (value: string) => void
  onOriginFocus: () => void
  onDestFocus: () => void
  onOriginBlur: () => void
  onDestBlur: () => void
  onSelectOrigin: (place: PlaceSuggestion) => void
  onSelectDestination: (place: PlaceSuggestion) => void
  onClearDestination: () => void
  onUseMyLocation: () => void
  onSwap: () => void
  onDestinationEnter?: () => void
  confirmSlot?: ReactNode
}

export default function RouteSearchBar({
  originInput,
  destinationInput,
  originFocused,
  destFocused,
  originSuggestions,
  destSuggestions,
  onOriginChange,
  onDestinationChange,
  onOriginFocus,
  onDestFocus,
  onOriginBlur,
  onDestBlur,
  onSelectOrigin,
  onSelectDestination,
  onClearDestination,
  onUseMyLocation,
  onSwap,
  onDestinationEnter,
  confirmSlot,
}: RouteSearchBarProps) {
  const showOriginList = originFocused && originSuggestions.length > 0
  const showDestList = destFocused && destSuggestions.length > 0 && destinationInput.trim().length >= 2

  return (
    <div className="chama-route-card">
      <div className="chama-route-row">
        <div className="chama-route-dots">
          <span className="chama-dot chama-dot-origin" />
          <span className="chama-route-line" />
          <span className="chama-dot chama-dot-dest" />
        </div>
        <div className="chama-route-fields">
          <div className="chama-route-field">
            <label className="chama-route-label" htmlFor="route-origin">Origem</label>
            <div className="chama-route-input-wrap">
            <input
              id="route-origin"
              type="text"
              className="chama-route-input"
              placeholder="De onde você sai?"
              value={originInput}
              onChange={(e) => onOriginChange(e.target.value)}
              onFocus={onOriginFocus}
              onBlur={() => setTimeout(onOriginBlur, 200)}
            />
            <button type="button" className="chama-route-icon-btn" onClick={onUseMyLocation} title="Minha localização">
              <Navigation className="h-4 w-4" />
            </button>
            </div>
            {showOriginList && (
              <ul className="chama-suggestions">
                {originSuggestions.map((place, idx) => (
                  <li key={`o-${idx}`}>
                    <button type="button" onMouseDown={() => onSelectOrigin(place)}>
                      <MapPin className="h-4 w-4 shrink-0 text-[#39ff6a]" />
                      <span className="chama-suggestion-text">
                        <span>{place.address}</span>
                        {formatPlaceDistance(place.distance_m) ? (
                          <small>{formatPlaceDistance(place.distance_m)}</small>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="chama-route-field">
            <label className="chama-route-label chama-route-label-dest" htmlFor="route-dest">Destino</label>
            <div className="chama-route-input-wrap">
            <input
              id="route-dest"
              type="text"
              className="chama-route-input chama-route-input-dest"
              placeholder="Para onde você vai?"
              value={destinationInput}
              onChange={(e) => onDestinationChange(e.target.value)}
              onFocus={onDestFocus}
              onBlur={() => setTimeout(onDestBlur, 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onDestinationEnter?.()
                }
              }}
            />
            {destinationInput ? (
              <button type="button" className="chama-route-icon-btn" onClick={onClearDestination}>
                <X className="h-4 w-4" />
              </button>
            ) : null}
            </div>
            {showDestList && (
              <ul className="chama-suggestions">
                {destSuggestions.map((place, idx) => (
                  <li key={`d-${idx}`}>
                    <button type="button" onMouseDown={() => onSelectDestination(place)}>
                      <MapPin className="h-4 w-4 shrink-0 text-red-400" />
                      <span className="chama-suggestion-text">
                        <span>{place.address}</span>
                        {formatPlaceDistance(place.distance_m) ? (
                          <small>{formatPlaceDistance(place.distance_m)}</small>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button type="button" className="chama-swap-btn" onClick={onSwap} title="Inverter origem e destino">
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>
      {confirmSlot ? <div className="chama-route-confirm">{confirmSlot}</div> : null}
    </div>
  )
}

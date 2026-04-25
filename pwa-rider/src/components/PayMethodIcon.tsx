import type { RidePaymentIconKey } from '../types/rideFlow'

type Props = {
  kind: RidePaymentIconKey
  className?: string
}

export function PayMethodIcon({ kind, className = '' }: Props) {
  const base = `pwa-pay-ico ${className}`.trim()
  if (kind === 'pix') {
    return (
      <span className={`${base} pwa-pay-ico--pix-wrap`} aria-hidden>
        <span className="pwa-pay-ico--pix" />
      </span>
    )
  }
  if (kind === 'cash') {
    return (
      <span className={base} aria-hidden>
        💵
      </span>
    )
  }
  if (kind === 'terminal') {
    return (
      <span className={`${base} pwa-pay-ico--terminal`} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="7" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 11h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="17" cy="5" r="2.5" fill="currentColor" />
        </svg>
      </span>
    )
  }
  return (
    <span className={base} aria-hidden>
      💳
    </span>
  )
}

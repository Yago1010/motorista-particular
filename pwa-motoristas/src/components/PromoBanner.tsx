interface PromoBannerProps {
  title?: string
  subtitle?: string
  description?: string
  ctaLabel?: string
  onCtaClick?: () => void
  link?: string
}

export default function PromoBanner({
  title = 'DE MECÂNICAS DE INCENTIVO A JOGOS NO PDA,',
  subtitle = 'a Central Camisa 10 é o seu ponto de encontro com a Copa.',
  description = 'Abre o app e vem com a gente!',
  ctaLabel = 'Vem conferir',
  onCtaClick,
  link,
}: PromoBannerProps) {
  const handleClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
      return
    }
    onCtaClick?.()
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-6 text-white"
      style={{
        background: 'radial-gradient(circle at center, #e63946 0%, #c1121f 55%, #9d0208 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 16px)',
      }} />
      <div className="relative z-10 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{title}</p>
        <p className="text-lg font-bold leading-snug">{subtitle}</p>
        <p className="text-sm opacity-95">{description}</p>
        <button
          type="button"
          onClick={handleClick}
          className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Eye, EyeOff, DollarSign } from 'lucide-react'

interface BalanceBarProps {
  balance: number
  className?: string
}

export default function BalanceBar({ balance, className = '' }: BalanceBarProps) {
  const [visible, setVisible] = useState(false)

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(balance)

  return (
    <div
      className={`flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-md border border-gray-100 ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <DollarSign className="h-5 w-5" />
      </div>
      <div className="flex-1 text-center">
        <span className="text-lg font-bold text-gray-900">
          {visible ? formatted : 'R$ ••••'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600"
        aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { entregaItemFormSchema } from '../lib/validation/schemas'
import { zodIssuesToRecord } from '../lib/validation/zodUtils'
import type { EntregaDetailsNavState, EntregaItemDetails } from '../types/entregaFlow'

const TYPES: { id: string; label: string; icon: string }[] = [
  { id: 'pessoal', label: 'Itens pessoais', icon: '🧍' },
  { id: 'alim', label: 'Alimentação', icon: '🥤' },
  { id: 'vest', label: 'Vestuário', icon: '👕' },
  { id: 'eletro', label: 'Eletrônicos', icon: '📱' },
  { id: 'doc', label: 'Documentos', icon: '📄' },
  { id: 'chaves', label: 'Chaves', icon: '🔑' },
  { id: 'med', label: 'Medicamentos', icon: '💊' },
  { id: 'outros', label: 'Outros', icon: '▦' },
]

function formatMoneyInput(raw: string) {
  const d = raw.replace(/\D/g, '')
  if (!d) return ''
  const n = Number(d) / 100
  return n.toFixed(2).replace('.', ',')
}

export function EntregaItemPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.state as EntregaDetailsNavState | null

  const [typeId, setTypeId] = useState(base?.item?.typeId ?? '')
  const [valueBrl, setValueBrl] = useState(base?.item?.valueBrl ?? '')
  const [notes, setNotes] = useState(base?.item?.notes ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const typeLabel = useMemo(() => TYPES.find((t) => t.id === typeId)?.label ?? '', [typeId])

  if (!base?.pickupPrimary || !base?.dropPrimary) {
    return <Navigate to="/entrega" replace />
  }

  function close() {
    navigate('/entrega/detalhes', { replace: true, state: base })
  }

  function confirm() {
    const tid = typeId || 'outros'
    const r = entregaItemFormSchema.safeParse({
      typeId: tid,
      valueBrl,
      notes,
    })
    if (!r.success) {
      setFieldErrors(zodIssuesToRecord(r.error))
      return
    }
    setFieldErrors({})
    const item: EntregaItemDetails = {
      typeId: tid,
      typeLabel: typeLabel || 'Outros',
      valueBrl: valueBrl || '0,00',
      notes: notes.trim(),
    }
    navigate('/entrega/detalhes', { replace: true, state: { ...base, item } })
  }

  return (
    <div className="pwa-ent-item-overlay" role="presentation">
      <button type="button" className="pwa-ent-item-scrim" aria-label="Fechar" onClick={close} />
      <div className="pwa-ent-item-sheet-outer">
        <div className="pwa-ent-item-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-ent-item-hd">
        <div className="pwa-ent-item-grab" aria-hidden />
        <header className="pwa-ent-item-head">
          <button type="button" className="pwa-ent-item-back" aria-label="Voltar" onClick={close}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 id="pwa-ent-item-hd" className="pwa-ent-item-title">
            Detalhes da entrega
          </h2>
          <button type="button" className="pwa-ent-item-x" aria-label="Fechar" onClick={close}>
            ✕
          </button>
        </header>

        <div className="pwa-ent-item-body">
          <h3 className="pwa-ent-item-sec">Detalhes do item</h3>
          <p className="pwa-ent-item-subsec">Tipo de item</p>
          <div className="pwa-ent-item-grid">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`pwa-ent-item-chip${typeId === t.id ? ' pwa-ent-item-chip--on' : ''}`}
                onClick={() => {
                  setTypeId(t.id)
                  if (fieldErrors.typeId) setFieldErrors((f) => ({ ...f, typeId: '' }))
                }}
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          {fieldErrors.typeId ? <p className="pwa-field-error">{fieldErrors.typeId}</p> : null}

          <label className="pwa-ent-item-field">
            <span className="pwa-ent-item-lbl">Valor do item</span>
            <div className="pwa-ent-item-money">
              <span>R$</span>
              <input
                inputMode="numeric"
                placeholder="Insira o valor do item"
                value={valueBrl}
                onChange={(e) => {
                  setValueBrl(formatMoneyInput(e.target.value))
                  if (fieldErrors.valueBrl) setFieldErrors((f) => ({ ...f, valueBrl: '' }))
                }}
              />
            </div>
            <p className="pwa-ent-item-discl">A Chama não sugere envio de itens com valor superior a R$500</p>
            {fieldErrors.valueBrl ? <p className="pwa-field-error">{fieldErrors.valueBrl}</p> : null}
          </label>

          <label className="pwa-ent-item-field">
            <span className="pwa-ent-item-lbl">Observações da entrega</span>
            <textarea
              className="pwa-ent-item-ta"
              rows={3}
              placeholder="Adicione uma descrição ou observações"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (fieldErrors.notes) setFieldErrors((f) => ({ ...f, notes: '' }))
              }}
            />
            {fieldErrors.notes ? <p className="pwa-field-error">{fieldErrors.notes}</p> : null}
          </label>
        </div>

        <div className="pwa-ent-item-foot">
          <button type="button" className="pwa-ent-item-confirm" onClick={confirm}>
            Confirmar
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { readRecentDestinations, type RecentDestination } from '../lib/recentDestinations'
import { entregaDestinatarioMapFormSchema, entregaRemetenteFormSchema } from '../lib/validation/schemas'
import { zodIssuesToRecord } from '../lib/validation/zodUtils'
import type { EntregaColetaPoint, EntregaColetaSearchNavState, EntregaDetailsNavState, EntregaRecipientNavState } from '../types/entregaFlow'

function digitsOnly(s: string) {
  return s.replace(/\D/g, '')
}

export function EntregaRecipientPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.state as EntregaRecipientNavState | null

  const mode = base?.mode ?? 'enviar'
  const isReceber = mode === 'receber'

  const [addressDetails, setAddressDetails] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [recent] = useState<RecentDestination[]>(() => readRecentDestinations())

  const phoneDigits = useMemo(() => digitsOnly(phone), [phone])

  const parsedEnviar = useMemo(() => {
    if (isReceber) return null
    return entregaDestinatarioMapFormSchema.safeParse({
      addressDetails: addressDetails.trim() || undefined,
      contactName,
      phoneDigits,
      destino: base?.destino,
    })
  }, [isReceber, base?.destino, addressDetails, contactName, phoneDigits])

  const parsedReceber = useMemo(() => {
    if (!isReceber || !base?.coleta) return null
    return entregaRemetenteFormSchema.safeParse({
      addressDetails: addressDetails.trim() || undefined,
      contactName,
      phoneDigits,
      coleta: base.coleta,
    })
  }, [isReceber, base?.coleta, addressDetails, contactName, phoneDigits])

  const valid = isReceber ? parsedReceber?.success === true : parsedEnviar?.success === true

  if (!base?.pickupPrimary) {
    return <Navigate to="/entrega" replace />
  }

  function openMapSearch(purpose: 'coleta' | 'destino') {
    if (!base) return
    const ob = base.originBias
    if (!ob) {
      const key = purpose === 'coleta' ? '_coleta' : '_destino'
      setFieldErrors((f) => ({
        ...f,
        [key]: 'Ativa a localização na página inicial e tenta novamente.',
      }))
      return
    }
    setFieldErrors((f) => ({ ...f, _coleta: '', _destino: '' }))
    const payload: EntregaColetaSearchNavState = {
      origin: ob,
      purpose,
      recipientSnapshot: base,
    }
    navigate('/entrega/busca-coleta', { state: payload })
  }

  function applyRecentColeta(r: RecentDestination) {
    const coleta: EntregaColetaPoint = {
      lat: r.lat,
      lng: r.lng,
      primary: r.primaryText,
      secondary: r.secondaryText,
    }
    navigate('/entrega/destinatario', {
      replace: true,
      state: { ...base, coleta },
    })
  }

  function applyRecentDestino(r: RecentDestination) {
    const destino: EntregaColetaPoint = {
      lat: r.lat,
      lng: r.lng,
      primary: r.primaryText,
      secondary: r.secondaryText,
    }
    navigate('/entrega/destinatario', {
      replace: true,
      state: { ...base, destino },
    })
  }

  function submit() {
    if (!base) return
    if (isReceber) {
      if (!base.coleta) {
        setFieldErrors({ _coleta: 'Seleciona o endereço de coleta no mapa.' })
        return
      }
      const r = entregaRemetenteFormSchema.safeParse({
        addressDetails: addressDetails.trim() || undefined,
        contactName,
        phoneDigits,
        coleta: base.coleta,
      })
      if (!r.success) {
        setFieldErrors(zodIssuesToRecord(r.error))
        return
      }
      setFieldErrors({})
      const c = r.data.coleta
      const det = (r.data.addressDetails ?? '').trim()
      let pickupPrimary = c.primary
      if (det) pickupPrimary = `${pickupPrimary} — ${det}`
      else if (c.secondary && c.secondary !== c.primary) pickupPrimary = `${pickupPrimary} — ${c.secondary}`
      const pickupSecondary = `${r.data.contactName.trim()} · ${r.data.phoneDigits}`
      const details: EntregaDetailsNavState = {
        flow: 'receber',
        pickupPrimary,
        pickupSecondary,
        dropPrimary: base.pickupPrimary,
        dropSecondary: base.pickupSecondary,
        service: 'moto',
      }
      navigate('/entrega/detalhes', { state: details })
      return
    }

    if (!base.destino) {
      setFieldErrors({ _destino: 'Seleciona o endereço de entrega no mapa.' })
      return
    }
    const r = entregaDestinatarioMapFormSchema.safeParse({
      addressDetails: addressDetails.trim() || undefined,
      contactName,
      phoneDigits,
      destino: base.destino,
    })
    if (!r.success) {
      setFieldErrors(zodIssuesToRecord(r.error))
      return
    }
    setFieldErrors({})
    const d = r.data.destino
    const det = (r.data.addressDetails ?? '').trim()
    let dropPrimary = d.primary
    if (det) dropPrimary = `${dropPrimary} — ${det}`
    else if (d.secondary && d.secondary !== d.primary) dropPrimary = `${dropPrimary} — ${d.secondary}`
    const details: EntregaDetailsNavState = {
      flow: 'enviar',
      pickupPrimary: base.pickupPrimary,
      pickupSecondary: base.pickupSecondary,
      dropPrimary,
      dropSecondary: `${r.data.contactName.trim()} · ${r.data.phoneDigits}`,
      service: 'moto',
    }
    navigate('/entrega/detalhes', { state: details })
  }

  const title = isReceber ? 'Informações do remetente' : 'Informações do destinatário'
  const phAddress = isReceber ? 'Selecionar endereço de coleta' : 'Selecionar endereço de entrega'
  const phName = isReceber ? 'Digite o nome do remetente' : 'Digite o nome do destinatário'
  const phPhone = isReceber ? 'Telefone do remetente' : 'Telefone do destinatário'

  return (
    <div className="pwa-ent-rec">
      <header className="pwa-ent-rec-head">
        <button type="button" className="pwa-ent-rec-back" aria-label="Voltar" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="pwa-ent-rec-title">{title}</h1>
      </header>

      <div className="pwa-ent-rec-body">
        <div className="pwa-ent-rec-field">
          <span className="pwa-ent-rec-lbl">Endereço*</span>
          <button
            type="button"
            className="pwa-ent-rec-maprow"
            onClick={() => openMapSearch(isReceber ? 'coleta' : 'destino')}
          >
            <span className="pwa-ent-rec-maprow-mid">
              {isReceber ? (
                base.coleta ? (
                  <>
                    <span className="pwa-ent-rec-maprow-t">{base.coleta.primary}</span>
                    <span className="pwa-ent-rec-maprow-s">{base.coleta.secondary}</span>
                  </>
                ) : (
                  <span className="pwa-ent-rec-maprow-ph">{phAddress}</span>
                )
              ) : base.destino ? (
                <>
                  <span className="pwa-ent-rec-maprow-t">{base.destino.primary}</span>
                  <span className="pwa-ent-rec-maprow-s">{base.destino.secondary}</span>
                </>
              ) : (
                <span className="pwa-ent-rec-maprow-ph">{phAddress}</span>
              )}
            </span>
            <span className="pwa-ent-rec-maprow-chev" aria-hidden>
              ›
            </span>
          </button>
          {fieldErrors._coleta ? <p className="pwa-field-error">{fieldErrors._coleta}</p> : null}
          {fieldErrors._destino ? <p className="pwa-field-error">{fieldErrors._destino}</p> : null}
        </div>

        <label className="pwa-ent-rec-field">
          <span className="pwa-ent-rec-lbl">Detalhes do endereço</span>
          <input
            className="pwa-ent-rec-input"
            placeholder="Ex.: bloco A, apartamento 201"
            value={addressDetails}
            onChange={(e) => {
              setAddressDetails(e.target.value)
              if (fieldErrors.addressDetails) setFieldErrors((f) => ({ ...f, addressDetails: '' }))
            }}
          />
          {fieldErrors.addressDetails ? <p className="pwa-field-error">{fieldErrors.addressDetails}</p> : null}
        </label>

        <label className="pwa-ent-rec-field">
          <span className="pwa-ent-rec-lbl">Nome para contato*</span>
          <span className="pwa-ent-rec-inputwrap">
            <input
              className="pwa-ent-rec-input"
              placeholder={phName}
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value)
                if (fieldErrors.contactName) setFieldErrors((f) => ({ ...f, contactName: '' }))
              }}
              autoComplete="name"
            />
            <span className="pwa-ent-rec-inico" aria-hidden>
              👤
            </span>
          </span>
          {fieldErrors.contactName ? <p className="pwa-field-error">{fieldErrors.contactName}</p> : null}
        </label>

        <label className="pwa-ent-rec-field">
          <span className="pwa-ent-rec-lbl">Número de telefone*</span>
          <div className="pwa-ent-rec-phone">
            <span className="pwa-ent-rec-cc">🇧🇷 +55</span>
            <input
              className="pwa-ent-rec-input pwa-ent-rec-input--phone"
              inputMode="numeric"
              placeholder={phPhone}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (fieldErrors.phoneDigits) setFieldErrors((f) => ({ ...f, phoneDigits: '' }))
              }}
              autoComplete="tel"
            />
          </div>
          {fieldErrors.phoneDigits ? <p className="pwa-field-error">{fieldErrors.phoneDigits}</p> : null}
        </label>

        {recent.length > 0 ? (
          <section className="pwa-ent-rec-recent" aria-label="Endereços recentes">
            <h2 className="pwa-ent-rec-recent-hd">Endereços recentes</h2>
            <ul className="pwa-ent-rec-recent-list">
              {recent.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="pwa-ent-rec-recent-item"
                    onClick={() => (isReceber ? applyRecentColeta(r) : applyRecentDestino(r))}
                  >
                    <span className="pwa-ent-rec-recent-pin" aria-hidden>
                      📍
                    </span>
                    <span className="pwa-ent-rec-recent-mid">
                      <span className="pwa-ent-rec-recent-t">{r.primaryText}</span>
                      <span className="pwa-ent-rec-recent-s">{r.secondaryText}</span>
                    </span>
                    <span className="pwa-ent-rec-recent-edit" aria-hidden>
                      ✎
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <button type="button" className="pwa-ent-rec-submit" disabled={!valid} onClick={submit}>
          Confirmar
        </button>
      </div>
    </div>
  )
}

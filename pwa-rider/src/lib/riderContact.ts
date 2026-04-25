import type { RiderSession } from '../types'
import { readSession } from './storage'

const LS_WA = 'pwa_chama_rider_whatsapp'

/** Dígitos do WhatsApp guardados localmente (fallback se a API não enviar `phone`). */
export function readRiderWhatsappDigits(): string {
  try {
    const raw = localStorage.getItem(LS_WA)
    return raw ? raw.replace(/\D/g, '') : ''
  } catch {
    return ''
  }
}

export function saveRiderWhatsappDigits(digits: string): void {
  try {
    const d = digits.replace(/\D/g, '')
    if (d.length >= 10) localStorage.setItem(LS_WA, d)
  } catch {
    /* ignora */
  }
}

/**
 * Linha “Nome · telefone” para o próprio passageiro (Chama Entrega).
 * Usa `session.phone` (login) ou número guardado em localStorage; só depois usa e-mail.
 */
export function formatRiderWhatsAppLine(session: RiderSession | null = readSession()): string {
  const name = (session?.first_name || 'Passageiro').trim()
  const fromSession = session?.phone?.replace(/\D/g, '') ?? ''
  const fromLs = readRiderWhatsappDigits()
  const digits = fromSession.length >= 10 ? fromSession : fromLs
  if (digits.length >= 10) return `${name} · ${digits}`
  const mail = session?.email?.trim()
  return mail ? `${name} · ${mail}` : name
}

import type { z } from 'zod'

/** Primeira mensagem por campo (primeiro segmento do path). */
export function zodIssuesToRecord(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : '_form'
    if (out[key] == null) out[key] = issue.message
  }
  return out
}

export function firstFormError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dados inválidos.'
}

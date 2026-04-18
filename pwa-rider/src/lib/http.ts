/** Cliente HTTP mínimo com erros claros (rede + JSON + success:false). */

export class ApiError extends Error {
  readonly code?: number
  readonly body?: unknown

  constructor(message: string, code?: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.body = body
  }
}

export function getApiBase(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV ? '' : 'http://localhost:8080')
  )
}

/** Alvo real do Laravel em dev (proxy Vite); útil para diagnóstico. */
export function getDevBackendHint(): string {
  if (!import.meta.env.DEV) return ''
  return import.meta.env.VITE_PROXY_TARGET || 'http://localhost:8080'
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function hasSuccessFalse(payload: unknown): boolean {
  return isRecord(payload) && payload.success === false
}

export function getApiErrorMessage(payload: unknown): string {
  if (!isRecord(payload)) return 'Resposta inválida do servidor'
  const err = payload.error
  const code = payload.error_code
  const base = typeof err === 'string' ? err : 'Operação falhou'
  if (typeof code === 'number') return `${base} (código ${code})`
  return base
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiError(
      `Resposta não é JSON (HTTP ${response.status}): ${text.slice(0, 160)}`,
      response.status,
    )
  }
}

type FormInput = Record<string, string | number | undefined | null>

export async function postForm(path: string, body: FormInput, options?: { allowFailure?: boolean }): Promise<unknown> {
  const base = getApiBase()
  const params = new URLSearchParams()
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v))
  })
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
    })
  } catch {
    throw new ApiError(
      `Sem ligação ao servidor. Em dev o proxy deve apontar para o Laravel (${getDevBackendHint() || 'configura VITE_PROXY_TARGET'}).`,
    )
  }

  const payload = await parseJson(response)
  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(payload) || `HTTP ${response.status}`, response.status, payload)
  }
  if (!options?.allowFailure && hasSuccessFalse(payload)) {
    throw new ApiError(getApiErrorMessage(payload), isRecord(payload) ? Number(payload.error_code) || undefined : undefined, payload)
  }
  return payload
}

export async function getQuery(
  path: string,
  query: FormInput,
  options?: { allowFailure?: boolean },
): Promise<unknown> {
  const base = getApiBase()
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v))
  })
  const pathWithQuery = `${path}?${params.toString()}`
  let response: Response
  try {
    response = await fetch(`${base}${pathWithQuery}`)
  } catch {
    throw new ApiError(
      `Sem ligação ao servidor. Verifica o backend (${getDevBackendHint() || getApiBase() || 'VITE_API_BASE_URL'}).`,
    )
  }
  const payload = await parseJson(response)
  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(payload) || `HTTP ${response.status}`, response.status, payload)
  }
  if (!options?.allowFailure && hasSuccessFalse(payload)) {
    throw new ApiError(getApiErrorMessage(payload), isRecord(payload) ? Number(payload.error_code) || undefined : undefined, payload)
  }
  return payload
}

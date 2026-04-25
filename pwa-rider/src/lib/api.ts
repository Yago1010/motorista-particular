import { z } from 'zod'
import { getApiErrorMessage, hasSuccessFalse, postForm, getQuery } from './http'
import type { ApiEnvelope, RequestDetails, RequestInProgress, RiderSession } from '../types'

const loginSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  error_code: z.number().optional(),
  id: z.number().optional(),
  token: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
})

export async function loginRider(email: string, password: string): Promise<RiderSession> {
  const payload = await postForm(
    '/user/login',
    {
      email,
      password,
      login_by: 'manual',
      device_type: 'android',
      device_token: 'pwa-rider-device',
    },
    { allowFailure: true },
  )
  const parsed = loginSchema.parse(payload)
  if (!parsed.success || !parsed.id || !parsed.token) {
    throw new Error(parsed.error ?? getApiErrorMessage(payload) ?? 'Falha ao autenticar')
  }
  return {
    id: parsed.id,
    token: parsed.token,
    first_name: parsed.first_name ?? '',
    last_name: parsed.last_name ?? '',
    email: parsed.email ?? email,
    phone: parsed.phone?.trim() || undefined,
  }
}

export async function createRideRequest(
  session: RiderSession,
  latitude: number,
  longitude: number,
  opts?: {
    destinationLatitude?: number
    destinationLongitude?: number
    /** 1 = dinheiro; 2 = cartão / eletrónico (conforme backend legado). */
    payment_mode?: number
  },
): Promise<ApiEnvelope> {
  const body: Record<string, string | number> = {
    token: session.token,
    id: session.id,
    type: 1,
    latitude,
    longitude,
    payment_mode: opts?.payment_mode ?? 1,
  }
  if (opts?.destinationLatitude !== undefined && opts?.destinationLongitude !== undefined) {
    body.d_latitude = opts.destinationLatitude
    body.d_longitude = opts.destinationLongitude
  }
  const raw = await postForm('/user/createrequest', body)
  return raw as ApiEnvelope
}

export async function getRequestInProgress(session: RiderSession): Promise<RequestInProgress> {
  const raw = await getQuery('/user/requestinprogress', {
    token: session.token,
    id: session.id,
  })
  if (hasSuccessFalse(raw)) {
    throw new Error(getApiErrorMessage(raw))
  }
  return raw as RequestInProgress
}

export async function getRideRequest(
  session: RiderSession,
  requestId: number,
  options?: { allowFailure?: boolean },
): Promise<RequestDetails> {
  const raw = await getQuery(
    '/user/getrequest',
    {
      token: session.token,
      id: session.id,
      request_id: requestId,
    },
    { allowFailure: true },
  )
  if (!options?.allowFailure && hasSuccessFalse(raw)) {
    throw new Error(getApiErrorMessage(raw))
  }
  return raw as RequestDetails
}

/** Posição atual do motorista + distância acumulada (quando já confirmado). */
export async function getRequestLocation(
  session: RiderSession,
  requestId: number,
): Promise<Record<string, unknown>> {
  const raw = await getQuery(
    '/user/getrequestlocation',
    {
      token: session.token,
      id: session.id,
      request_id: requestId,
    },
    { allowFailure: true },
  )
  return raw as Record<string, unknown>
}

export async function cancelRideRequest(session: RiderSession, requestId: number): Promise<ApiEnvelope> {
  const raw = await postForm(
    '/user/cancelrequest',
    {
      token: session.token,
      id: session.id,
      request_id: requestId,
    },
    { allowFailure: true },
  )
  return raw as ApiEnvelope
}

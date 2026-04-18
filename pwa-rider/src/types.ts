export type RiderSession = {
  id: number
  token: string
  first_name: string
  last_name: string
  email: string
}

export type ApiEnvelope<T = Record<string, unknown>> = {
  success: boolean
  error?: string
  error_code?: number
} & T

export type RequestInProgress = {
  request_id: number
  success: boolean
}

export type RequestDetails = {
  success: boolean
  request_id?: number
  confirmed_walker?: number
  is_cancelled?: number
  is_completed?: number
  is_started?: number
  is_walker_arrived?: number
  is_walker_started?: number
  payment_mode?: number | string
  [key: string]: unknown
}

export type DriverSession = {
  id: number
  token: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

export type ApiEnvelope<T = Record<string, unknown>> = {
  success: boolean
  error?: string
  error_code?: number
} & T
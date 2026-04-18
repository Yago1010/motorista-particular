/** Geolocalização fiável para o PWA: leitura fresca, retentativa e mensagens claras. */

export type GeoCoords = { lat: number; lng: number }

function fromPosition(p: GeolocationPosition): GeoCoords {
  return { lat: p.coords.latitude, lng: p.coords.longitude }
}

function messageForGeolocationError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Acesso ao GPS negado. Permite a localização nas definições do browser (ícone de cadeado ou do site) e tenta de novo.'
    case err.POSITION_UNAVAILABLE:
      return 'Posição indisponível. Ativa o GPS do telemóvel, o Wi‑Fi e tenta noutro sítio se estiveres em interior.'
    case err.TIMEOUT:
      return 'O GPS demorou demasiado. Vai para o exterior ou desativa poupança de energia e tenta outra vez.'
    default:
      return err.message || 'Não foi possível obter a localização.'
  }
}

function getOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/**
 * Obtém a posição atual: pede fix fresco (maximumAge: 0), alta precisão primeiro;
 * em falha por tempo ou indisponibilidade, tenta de novo só com rede (mais rápido em interior).
 */
export async function acquireCurrentPosition(): Promise<GeoCoords> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Este dispositivo ou browser não suporta geolocalização.')
  }

  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error(
      'O GPS só funciona em ligação segura. Abre o PWA em https ou em localhost (ex.: http://localhost:5173).',
    )
  }

  const accurate: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 28_000,
  }

  const network: PositionOptions = {
    enableHighAccuracy: false,
    maximumAge: 0,
    timeout: 22_000,
  }

  try {
    const p = await getOnce(accurate)
    return fromPosition(p)
  } catch (first) {
    const e = first as GeolocationPositionError
    if (e.code === e.PERMISSION_DENIED) {
      throw new Error(messageForGeolocationError(e))
    }
    try {
      const p2 = await getOnce(network)
      return fromPosition(p2)
    } catch (second) {
      const e2 = second as GeolocationPositionError
      throw new Error(messageForGeolocationError(e2))
    }
  }
}

export async function queryGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  const perm = navigator.permissions?.query?.bind(navigator.permissions) as
    | ((q: { name: 'geolocation' }) => Promise<PermissionStatus>)
    | undefined
  if (!perm) return 'unknown'
  try {
    const status = await perm({ name: 'geolocation' })
    return status.state as 'granted' | 'denied' | 'prompt'
  } catch {
    return 'unknown'
  }
}

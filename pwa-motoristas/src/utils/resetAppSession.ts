import { clearDriverSession } from '@/utils/authSession'
import { clearDemoRide } from '@/utils/demoRideBridge'

/** Limpa auth + corrida demo ao sair (logout / sessão expirada). */
export function resetDriverAppSession() {
  clearDriverSession()
  clearDemoRide()
  try {
    localStorage.removeItem('chama_demo')
  } catch {
    /* ignore */
  }
}

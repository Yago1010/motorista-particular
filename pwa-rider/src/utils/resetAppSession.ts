import { clearRiderSession } from '@/utils/authSession'
import { clearActiveRideSession } from '@/utils/activeRideSession'
import { clearDemoRide } from '@/utils/demoRideBridge'
import { clearDismissedRides } from '@/utils/dismissedRides'

/** Limpa auth + corrida ativa ao sair (logout / sessão expirada). */
export function resetRiderAppSession() {
  clearRiderSession()
  clearActiveRideSession()
  clearDemoRide()
  clearDismissedRides()
  try {
    localStorage.removeItem('chama_demo')
  } catch {
    /* ignore */
  }
}

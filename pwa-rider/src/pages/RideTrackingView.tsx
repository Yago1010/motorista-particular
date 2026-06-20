import { useParams } from 'react-router-dom'
import { HomeShell } from '@/pages/HomeView'

/** Mesma tela da Home — mapa, motorista, pagamento e abas inferiores. */
export default function RideTrackingView() {
  const { id } = useParams()
  return (
    <div className="chama-home chama-app-frame">
      <HomeShell trackingRideId={id} />
    </div>
  )
}

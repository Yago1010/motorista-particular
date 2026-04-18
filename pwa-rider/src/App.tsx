import { Navigate, Route, Routes } from 'react-router-dom'
import { DevFooter } from './components/DevFooter'
import { PassengerLayout } from './components/PassengerLayout'
import { EntregaPage } from './pages/EntregaPage'
import { DestinationSearchPage } from './pages/DestinationSearchPage'
import { HomeRidePage } from './pages/HomeRidePage'
import { RideConfirmPage } from './pages/RideConfirmPage'
import { LoginPage } from './pages/LoginPage'
import {
  AjudaPage,
  AtividadePage,
  ConfiguracoesPage,
  ConvidarAmigosPage,
  EscanearPage,
  MensagensPage,
  MetodosPagamentoPage,
  PerfilPage,
  SegurancaPage,
} from './pages/MenuPages'
import { PagarPage } from './pages/PagarPage'
import { TripStatusPage } from './pages/TripStatusPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<PassengerLayout />}>
          <Route path="/home" element={<HomeRidePage />} />
          <Route path="/destino" element={<DestinationSearchPage />} />
          <Route path="/confirmar" element={<RideConfirmPage />} />
          <Route path="/entrega" element={<EntregaPage />} />
          <Route path="/pagar" element={<PagarPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/atividade" element={<AtividadePage />} />
          <Route path="/ajuda" element={<AjudaPage />} />
          <Route path="/mensagens" element={<MensagensPage />} />
          <Route path="/seguranca" element={<SegurancaPage />} />
          <Route path="/metodos-pagamento" element={<MetodosPagamentoPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/convidar-amigos" element={<ConvidarAmigosPage />} />
          <Route path="/escanear" element={<EscanearPage />} />
          <Route path="/status/:requestId" element={<TripStatusPage />} />
        </Route>
        <Route path="/request" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevFooter />
    </>
  )
}

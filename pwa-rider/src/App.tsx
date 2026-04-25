import { Navigate, Route, Routes } from 'react-router-dom'
import { DevFooter } from './components/DevFooter'
import { PassengerLayout } from './components/PassengerLayout'
import { EntregaColetaSearchPage } from './pages/EntregaColetaSearchPage'
import { EntregaDetailsPage } from './pages/EntregaDetailsPage'
import { EntregaItemPage } from './pages/EntregaItemPage'
import { EntregaPage } from './pages/EntregaPage'
import { EntregaRecipientPage } from './pages/EntregaRecipientPage'
import { DestinationSearchPage } from './pages/DestinationSearchPage'
import { HomeRidePage } from './pages/HomeRidePage'
import { RideAddCardPage } from './pages/RideAddCardPage'
import { RideConfirmPage } from './pages/RideConfirmPage'
import { RidePaymentPickPage } from './pages/RidePaymentPickPage'
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
          <Route path="/confirmar/pagamento" element={<RidePaymentPickPage />} />
          <Route path="/confirmar/cartao" element={<RideAddCardPage />} />
          <Route path="/entrega" element={<EntregaPage />} />
          <Route path="/entrega/busca-coleta" element={<EntregaColetaSearchPage />} />
          <Route path="/entrega/destinatario" element={<EntregaRecipientPage />} />
          <Route path="/entrega/detalhes" element={<EntregaDetailsPage />} />
          <Route path="/entrega/item" element={<EntregaItemPage />} />
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

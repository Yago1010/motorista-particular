type MenuPageProps = {
  title: string
  description: string
}

function MenuPage({ title, description }: MenuPageProps) {
  return (
    <div className="pwa-stub-page">
      <div className="pwa-card">
        <h1>{title}</h1>
        <p className="pwa-muted">{description}</p>
      </div>
    </div>
  )
}

export function PerfilPage() {
  return <MenuPage title="Perfil" description="Aqui podes consultar e atualizar as tuas informações de conta." />
}

export function AtividadePage() {
  return <MenuPage title="Atividade" description="Histórico de corridas e ações da conta." />
}

export function AjudaPage() {
  return <MenuPage title="Ajuda" description="Suporte e perguntas frequentes do passageiro." />
}

export function MensagensPage() {
  return <MenuPage title="Mensagens" description="Comunicação e notificações da tua conta." />
}

export function SegurancaPage() {
  return <MenuPage title="Central de segurança" description="Opções de segurança para corridas e conta." />
}

export function MetodosPagamentoPage() {
  return <MenuPage title="Métodos de pagamento" description="Gerir cartões e métodos de pagamento." />
}

export function ConfiguracoesPage() {
  return <MenuPage title="Configurações" description="Preferências da aplicação e da conta." />
}

export function ConvidarAmigosPage() {
  return <MenuPage title="Convidar amigos" description="Convida amigos e partilha benefícios da plataforma." />
}

export function EscanearPage() {
  return <MenuPage title="Escanear" description="Área de scanner para próximas integrações." />
}

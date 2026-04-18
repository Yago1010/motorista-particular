import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { cancelRideRequest, getRideRequest } from '../lib/api'
import { readSession } from '../lib/storage'
import { getApiErrorMessage, hasSuccessFalse } from '../lib/http'

type Step = { id: string; label: string }

function buildSteps(data: Record<string, unknown>): { steps: Step[]; currentIndex: number; cancelled: boolean } {
  const cancelled = Number(data.is_cancelled) === 1
  const completed = Number(data.is_completed) === 1
  const arrived = Number(data.is_walker_arrived) === 1
  const walkerStarted = Number(data.is_walker_started) === 1
  const confirmed = Number(data.confirmed_walker) > 0

  const steps: Step[] = [
    { id: '1', label: 'Pedido registado' },
    { id: '2', label: 'Motorista aceitou' },
    { id: '3', label: 'Motorista a caminho' },
    { id: '4', label: 'Motorista chegou ao local' },
    { id: '5', label: 'Viagem em curso' },
    { id: '6', label: 'Viagem concluída' },
  ]

  if (cancelled) {
    return { steps, currentIndex: -1, cancelled: true }
  }

  let currentIndex = 0
  if (completed) currentIndex = 5
  else if (Number(data.is_started) === 1) currentIndex = 4
  else if (arrived) currentIndex = 3
  else if (walkerStarted) currentIndex = 2
  else if (confirmed) currentIndex = 1
  else currentIndex = 0

  return { steps, currentIndex, cancelled: false }
}

export function TripStatusPage() {
  const navigate = useNavigate()
  const session = readSession()
  const params = useParams<{ requestId: string }>()
  const requestId = Number(params.requestId)

  const query = useQuery({
    queryKey: ['ride-status', requestId],
    queryFn: async () => {
      if (!session) throw new Error('Sessão inválida')
      return getRideRequest(session, requestId)
    },
    refetchInterval: 5000,
    enabled: Number.isFinite(requestId) && requestId > 0 && !!session,
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Sessão inválida')
      return cancelRideRequest(session, requestId)
    },
    onSuccess: (data) => {
      if (hasSuccessFalse(data)) {
        return
      }
      void query.refetch()
    },
  })

  const timeline = useMemo(() => {
    if (!query.data) return null
    const d = query.data as Record<string, unknown>
    return buildSteps(d)
  }, [query.data])

  const headline = useMemo(() => {
    if (!query.data) return 'A carregar…'
    const d = query.data as Record<string, unknown>
    if (Number(d.is_cancelled) === 1) return 'Corrida cancelada'
    if (Number(d.is_completed) === 1) return 'Corrida concluída'
    if (Number(d.confirmed_walker) > 0) return 'Motorista atribuído'
    return 'À procura de motorista'
  }, [query.data])

  const cancelPayload = cancelMutation.data
  const cancelErr =
    cancelPayload && hasSuccessFalse(cancelPayload)
      ? getApiErrorMessage(cancelPayload)
      : cancelMutation.isError
        ? (cancelMutation.error as Error).message
        : ''

  return (
    <div className="pwa-card">
      <h1>Pedido #{requestId}</h1>
      <p className="pwa-muted">{headline}</p>

      {query.isError ? <p className="pwa-error">{(query.error as Error).message}</p> : null}

      {timeline && !query.isError ? (
        <ul className="pwa-timeline">
          {timeline.cancelled ? (
            <li className="pwa-step-current">Cancelada</li>
          ) : (
            timeline.steps.map((step, i) => {
              const done = i < timeline.currentIndex
              const current = i === timeline.currentIndex && !timeline.cancelled
              const cls = done ? 'pwa-step-done' : current ? 'pwa-step-current' : ''
              return (
                <li key={step.id} className={cls}>
                  {step.label}
                </li>
              )
            })
          )}
        </ul>
      ) : null}

      <div className="pwa-row-btns">
        <button type="button" className="pwa-btn-secondary" onClick={() => void query.refetch()}>
          Atualizar
        </button>
        <button
          type="button"
          className="pwa-btn-primary"
          disabled={
            cancelMutation.isPending ||
            headline === 'Corrida cancelada' ||
            headline === 'Corrida concluída'
          }
          onClick={() => cancelMutation.mutate()}
        >
          {cancelMutation.isPending ? 'A cancelar…' : 'Cancelar'}
        </button>
      </div>

      {cancelErr ? <p className="pwa-error" style={{ marginTop: 8 }}>{cancelErr}</p> : null}

      <button type="button" className="pwa-btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/home')}>
        Novo pedido
      </button>
    </div>
  )
}

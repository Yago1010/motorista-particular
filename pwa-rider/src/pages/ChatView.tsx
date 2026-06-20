import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useRidesStore } from '@/stores/rides'
import { useMessagePolling } from '@/hooks/useMessagePolling'

export default function ChatView() {
  const { rideId } = useParams()
  const ridesStore = useRidesStore()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(true)

  useEffect(() => {
    if (!rideId) return
    ridesStore.getMessages(rideId).then((result) => {
      if (result.success && result.messages?.length) {
        setMessages(result.messages)
      } else if (initialLoadRef.current) {
        setMessages([
          { id: 1, sender: 'driver', message: 'Estou a caminho!', created_at: new Date().toISOString() },
        ])
      }
      initialLoadRef.current = false
    })
    ridesStore.markMessagesAsRead(rideId)
  }, [rideId])

  const handlePollMessages = useCallback((incoming: any[]) => {
    setMessages(incoming)
  }, [])

  useMessagePolling(rideId, handlePollMessages, 3000)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!rideId || !text.trim()) return
    setLoading(true)
    const result = await ridesStore.sendMessage(rideId, text.trim())
    if (result.success) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'rider', message: text.trim(), created_at: new Date().toISOString() },
      ])
      setText('')
    } else {
      toast.error('Erro ao enviar mensagem')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link to={`/ride/${rideId}`} className="text-blue-600">
          ←
        </Link>
        <h1 className="font-semibold">Chat da corrida</h1>
        <span className="ml-auto text-xs text-gray-400">Atualiza a cada 3s</span>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.sender === 'rider' || msg.is_driver === false
                ? 'ml-auto bg-blue-600 text-white'
                : 'border bg-white'
            }`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-full border px-4 py-2"
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button type="button" disabled={loading} onClick={send} className="rounded-full bg-blue-600 px-4 py-2 text-white">
          Enviar
        </button>
      </div>
    </div>
  )
}

/**
 * Servidor Socket.io — APENAS chat in-app (namespace /driver).
 * Corridas: REST API + polling nos PWAs.
 */
const { createServer } = require('http')
const { Server } = require('socket.io')

const PORT = process.env.CHAT_PORT || 3002

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true, service: 'chat-server', namespace: '/driver' }))
})

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/socket.io',
})

function attachChatHandlers(socket) {
  socket.on('join:ride', ({ rideId }) => {
    if (!rideId) return
    socket.join(`ride:${rideId}`)
  })

  socket.on('leave:ride', ({ rideId }) => {
    if (!rideId) return
    socket.leave(`ride:${rideId}`)
  })

  socket.on('message:send', (payload) => {
    const { rideId, message, from, sender_name } = payload || {}
    if (!rideId || !message) return

    const event = {
      id: Date.now(),
      rideId,
      message,
      text: message,
      is_driver: from === 'driver',
      sender_name: sender_name || (from === 'driver' ? 'Motorista' : 'Passageiro'),
      created_at: new Date().toISOString(),
    }

    socket.to(`ride:${rideId}`).emit('message:new', event)
    socket.emit('message:new', event)
  })
}

io.of('/driver').on('connection', (socket) => {
  console.log('[chat/driver] connected', socket.id)
  attachChatHandlers(socket)
  socket.on('disconnect', () => console.log('[chat/driver] disconnected', socket.id))
})

httpServer.listen(PORT, () => {
  console.log(`Chat server on http://localhost:${PORT} (namespace: /driver)`)
})

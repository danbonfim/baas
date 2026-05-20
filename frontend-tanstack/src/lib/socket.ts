import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(token?: string): Socket {
  if (!socket) {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('baas_token') : null)
    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      auth: { token: t },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      autoConnect: false,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

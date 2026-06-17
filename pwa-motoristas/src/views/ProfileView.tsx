import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

export default function ProfileView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const user = authStore.user
  const [approvedDocs, setApprovedDocs] = useState(0)
  const [totalDocs, setTotalDocs] = useState(0)

  useEffect(() => {
    api.get('/api/driver/documents/stats').then((res) => {
      setApprovedDocs(res.data.approved)
      setTotalDocs(res.data.total)
    }).catch(() => {
      setApprovedDocs(3)
      setTotalDocs(4)
    })
  }, [])

  const logout = async () => {
    await authStore.logout()
    navigate('/login')
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
          {user?.first_name?.charAt(0) || 'M'}
        </div>
        <h2 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h2>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <p className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          {authStore.isOnline ? 'Online' : 'Offline'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/wallet" className="rounded-2xl border bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500">Carteira</p>
          <p className="font-semibold">Ver saldo</p>
        </Link>
        <Link to="/documents" className="rounded-2xl border bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500">Documentos</p>
          <p className="font-semibold">{approvedDocs}/{totalDocs} aprovados</p>
        </Link>
      </div>

      <div className="space-y-2">
        <button type="button" onClick={() => toast.info('Em desenvolvimento')} className="w-full rounded-xl border py-3">
          Editar perfil
        </button>
        <button type="button" onClick={() => toast.info('Em desenvolvimento')} className="w-full rounded-xl border py-3">
          Alterar senha
        </button>
        <button type="button" onClick={logout} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white">
          Sair
        </button>
      </div>
    </div>
  )
}

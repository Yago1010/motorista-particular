import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'

export default function ProfileView() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const user = authStore.user

  const logout = async () => {
    await authStore.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
          {user?.first_name?.charAt(0) || 'U'}
        </div>
        <h1 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <p className="text-sm text-gray-500">{user?.phone}</p>
      </div>

      <div className="mt-4 space-y-2">
        <button type="button" onClick={() => toast.info('Validação facial em desenvolvimento')} className="w-full rounded-xl border bg-white py-3">
          Validar foto de perfil (IA)
        </button>
        <button type="button" onClick={logout} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white">
          Sair
        </button>
      </div>
    </div>
  )
}

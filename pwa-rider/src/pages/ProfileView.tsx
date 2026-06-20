import { useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import ChamaAppShell from '@/components/ChamaAppShell'
import faceValidationService from '@/services/faceValidation'

export default function ProfileView() {
  const authStore = useAuthStore()
  const user = authStore.user
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFaceValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast.info('Validando foto de perfil...')
    const result = await faceValidationService.validateSelfie(file)
    if (result.success) {
      toast.success('Foto validada com sucesso!')
    } else {
      toast.error(result.message || 'Falha na validação facial')
    }
    e.target.value = ''
  }

  return (
    <ChamaAppShell title="Meu perfil">
      <div className="chama-shell-content">
        <div className="chama-profile-card">
          <div className="chama-profile-avatar">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <h2 className="chama-profile-name">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="chama-profile-meta">{user?.email}</p>
          {user?.phone && <p className="chama-profile-meta">{user.phone}</p>}
        </div>

        <div className="chama-profile-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFaceValidation}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="chama-btn-outline chama-profile-btn"
          >
            Validar foto de perfil (IA)
          </button>
        </div>
      </div>
    </ChamaAppShell>
  )
}

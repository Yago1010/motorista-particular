import api from './api'

class FaceValidationService {
  async validateSelfie(selfieFile: File, documentType = 'rg') {
    try {
      const formData = new FormData()
      formData.append('selfie', selfieFile)
      formData.append('document_type', documentType)

      const response = await api.post('/api/validation/selfie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro na validação facial' }
    }
  }

  async validateDocument(documentFile: File, documentType = 'rg') {
    try {
      const formData = new FormData()
      formData.append('document', documentFile)
      formData.append('document_type', documentType)

      const response = await api.post('/api/validation/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro na validação do documento' }
    }
  }

  async livenessCheck(videoFile: File) {
    try {
      const formData = new FormData()
      formData.append('video', videoFile)

      const response = await api.post('/api/validation/liveness', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erro na prova de vida' }
    }
  }
}

export default new FaceValidationService()

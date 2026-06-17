import api from './api'
import { AxiosError } from 'axios'

interface ValidationResponse {
  success: boolean
  data?: any
  message?: string
}

class FaceValidationService {
  async validateSelfie(selfieFile: File, documentType = 'cnh'): Promise<ValidationResponse> {
    try {
      const formData = new FormData()
      formData.append('selfie', selfieFile)
      formData.append('document_type', documentType)

      const response = await api.post('/api/validation/selfie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data }
    } catch (error) {
      const axiosError = error as AxiosError
      return { success: false, message: (axiosError.response?.data as { message?: string })?.message || 'Erro na validação facial' }
    }
  }

  async validateDocument(documentFile: File, documentType = 'cnh'): Promise<ValidationResponse> {
    try {
      const formData = new FormData()
      formData.append('document', documentFile)
      formData.append('document_type', documentType)

      const response = await api.post('/api/validation/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data }
    } catch (error) {
      const axiosError = error as AxiosError
      return { success: false, message: (axiosError.response?.data as { message?: string })?.message || 'Erro na validação do documento' }
    }
  }

  async livenessCheck(videoFile: File): Promise<ValidationResponse> {
    try {
      const formData = new FormData()
      formData.append('video', videoFile)

      const response = await api.post('/api/validation/liveness', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data }
    } catch (error) {
      const axiosError = error as AxiosError
      return { success: false, message: (axiosError.response?.data as { message?: string })?.message || 'Erro na prova de vida' }
    }
  }
}

export default new FaceValidationService()
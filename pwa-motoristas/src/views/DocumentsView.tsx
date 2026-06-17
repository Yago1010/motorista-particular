import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/services/api'

interface DocumentItem {
  id: number
  name: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/driver/documents')
      .then((res) => setDocuments(res.data || []))
      .catch(() => {
        setDocuments([
          { id: 1, name: 'CNH', status: 'approved' },
          { id: 2, name: 'CRLV', status: 'approved' },
          { id: 3, name: 'Selfie', status: 'pending' },
          { id: 4, name: 'Comprovante de endereço', status: 'rejected' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const uploadDocument = () => {
    toast.info('Upload de documento em desenvolvimento')
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold">Documentos</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-sm capitalize text-gray-500">{doc.status}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={uploadDocument} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">
        Enviar documento
      </button>
    </div>
  )
}

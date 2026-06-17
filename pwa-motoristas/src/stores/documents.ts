import { create } from 'zustand';

export interface Document {
  id: number;
  type: 'cnh' | 'crlv' | 'selfie' | 'background_check' | 'insurance';
  status: 'pending' | 'approved' | 'rejected';
  file_url?: string;
  rejection_reason?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsState {
  documents: Document[];
  loading: boolean;
  
  setDocuments: (documents: Document[]) => void;
  updateDocument: (document: Document) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: [],
  loading: false,

  setDocuments: (documents) => set({ documents }),
  updateDocument: (document) => set((state) => ({
    documents: state.documents.map((d) => d.id === document.id ? document : d),
  })),
  setLoading: (loading) => set({ loading }),
}));
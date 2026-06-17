'use client';

interface LoadingOverlayProps {
  isVisible?: boolean
  message?: string
}

export function LoadingOverlay({ isVisible = true, message = 'Carregando...' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-gray-700 text-center font-medium text-base">{message}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay
import { useEffect, useState } from 'react'
import api from '@/services/api'

export interface AppBanner {
  id: number
  title: string
  subtitle?: string
  description?: string
  cta_label?: string
  image_url?: string
  link_url?: string
  placement?: string
}

export function useAppBanners(app: 'rider' | 'driver', placement = 'home') {
  const [banners, setBanners] = useState<AppBanner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .get<{ banners: AppBanner[] }>('/app/banners', {
        params: { app, placement },
      })
      .then((res) => {
        if (!cancelled) setBanners(res.data.banners || [])
      })
      .catch(() => {
        if (!cancelled) setBanners([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [app, placement])

  return { banners, banner: banners[0] ?? null, loading }
}

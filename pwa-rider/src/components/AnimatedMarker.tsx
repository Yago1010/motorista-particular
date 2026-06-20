import { useEffect, useRef, useState } from 'react'
import { Marker } from 'react-leaflet'
import type { DivIcon, Marker as LeafletMarker } from 'leaflet'

interface AnimatedMarkerProps {
  position: [number, number]
  icon?: DivIcon
  popup?: string
  durationMs?: number
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export default function AnimatedMarker({ position, icon, popup, durationMs = 800 }: AnimatedMarkerProps) {
  const [displayPos, setDisplayPos] = useState<[number, number]>(position)
  const fromRef = useRef<[number, number]>(position)
  const rafRef = useRef<number>()
  const markerRef = useRef<LeafletMarker | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = position
    if (from[0] === to[0] && from[1] === to[1]) return

    const start = performance.now()
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      const lat = lerp(from[0], to[0], eased)
      const lng = lerp(from[1], to[1], eased)
      setDisplayPos([lat, lng])
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [position[0], position[1], durationMs])

  useEffect(() => {
    if (markerRef.current && popup) {
      markerRef.current.bindPopup(popup)
    }
  }, [popup])

  return (
    <Marker
      ref={markerRef}
      position={displayPos}
      icon={icon}
      eventHandlers={{
        add: (e) => {
          markerRef.current = e.target
          if (popup) e.target.bindPopup(popup)
        },
      }}
    />
  )
}

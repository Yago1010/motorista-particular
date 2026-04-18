/** Endereço legível (Nominatim OSM); falha silenciosa se rede/CORS bloquear. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const u = new URL('https://nominatim.openstreetmap.org/reverse')
    u.searchParams.set('format', 'jsonv2')
    u.searchParams.set('lat', String(lat))
    u.searchParams.set('lon', String(lng))
    const r = await fetch(u.toString(), { headers: { 'Accept-Language': 'pt-PT,pt-BR,en' } })
    if (!r.ok) return ''
    const j = (await r.json()) as { display_name?: string }
    const d = j.display_name
    if (!d) return ''
    return d.length > 76 ? `${d.slice(0, 73)}…` : d
  } catch {
    return ''
  }
}

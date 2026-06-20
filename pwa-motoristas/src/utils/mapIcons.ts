import L from 'leaflet'

export const pickupMarkerIcon = () =>
  L.divIcon({
    className: 'chama-map-marker',
    html: '<div style="background:#169648;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

export const destinationMarkerIcon = () =>
  L.divIcon({
    className: 'chama-map-marker',
    html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

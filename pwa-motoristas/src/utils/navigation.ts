export function openGoogleMapsNavigation(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  window.open(url, '_blank')
}

export function openWazeNavigation(lat: number, lng: number) {
  const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  window.open(url, '_blank')
}

export function openNavigation(lat: number, lng: number, preferWaze = false) {
  if (preferWaze) {
    openWazeNavigation(lat, lng)
  } else {
    openGoogleMapsNavigation(lat, lng)
  }
}

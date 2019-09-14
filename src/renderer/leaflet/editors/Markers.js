import L from 'leaflet'

const marker = (latlng, { className, handlers, midpoint }) => {
  const marker = new L.Marker(latlng, {
    draggable: true,
    icon: L.divIcon({ className })
  })

  marker.on(handlers)
  marker.midpoint = midpoint
  return marker
}

const markerHandlers = dragHandler => ({
  click: event => console.log('click', event),
  dragstart: ({ target }) => target._map.tools.disableMapClick(),
  dragend: ({ target }) => target._map.tools.enableMapClick(),
  drag: dragHandler
})

export const handleMarker = dragHandler => latlng => marker(latlng, {
  className: 'marker-icon',
  handlers: markerHandlers(dragHandler),
  midpoint: false
})

export const midpointMarker = dragHandler => latlng => marker(latlng, {
  className: 'marker-icon marker-icon-middle',
  handlers: markerHandlers(dragHandler),
  midpoint: true
})

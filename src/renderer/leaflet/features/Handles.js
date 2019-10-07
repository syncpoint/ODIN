import L from 'leaflet'
import { FULCRUM } from './handle-types'

L.Handles = L.LayerGroup.extend({

  /**
   *
   */
  addHandle (latlng, options) {
    const className = options.type === FULCRUM ? 'marker-icon' : 'marker-icon marker-icon-middle'
    const marker = new L.Marker(latlng, {
      draggable: true,
      icon: L.divIcon({ className })
    })

    marker.type = options.type
    this._registerListeners(marker, options)
    return marker.addTo(this)
  },


  /**
   *
   */
  removeHandle (handle) {
    this.removeLayer(handle)
  },


  /**
   * Used to upgrade a middle handle to a main handle.
   */
  updateHandle (marker, options) {
    marker.type = FULCRUM
    L.DomUtil.removeClass(marker._icon, 'marker-icon-middle')
    this._registerListeners(marker, options)
  },


  /**
   *
   */
  _registerListeners (marker, options) {
    ['click', 'mousedown', 'dragstart', 'drag', 'dragend'].forEach(event => marker.off(event))

    marker.on('click', () => {}) // must not bubble up to map.
    if (options.mousedown) marker.on('mousedown', options.mousedown)

    // Disable click event on map while dragging:
    marker.on('dragstart', ({ target }) => target._map.tools.disableMapClick())
    marker.on('drag', options.drag)
    marker.on('dragend', event => {
      const { target } = event
      target._map.tools.enableMapClick()
      options.dragend && options.dragend(event)
    })

    return marker
  }
})

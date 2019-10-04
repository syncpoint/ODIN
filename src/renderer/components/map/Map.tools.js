import Mousetrap from 'mousetrap'
import L from 'leaflet'
import evented from '../../evented'

const selectionTool = _ => ({
  name: 'select',
  handle: _ => {},
  dispose: () => {}
})

/**
 * Draw Tool.
 */
const drawTool = map => options => {
  const prompt = options.prompt || ''
  evented.emit('OSD_MESSAGE', { message: prompt })

  const layerGroup = new L.LayerGroup().addTo(map)
  const polyline = L.polyline([]).addTo(layerGroup)
  const hintline = L.polyline([]).addTo(layerGroup)
  const icon = L.divIcon({ className: 'marker-icon cursor-marker' })

  const done = () => {
    const latlngs = polyline.getLatLngs()

    switch (options.geometryType) {
      case 'line': if (latlngs.length < 2) return; break
      case 'polygon': if (latlngs.length < 3) return; break
    }

    options.done(latlngs)
    map.tools.dispose()
  }

  let px = 0
  let py = 0

  const append = event => {
    const latlng = event.latlng
    // Prevent adding duplicates or point close to last point.
    const sq = x => x * x
    const d = Math.sqrt(sq(px - event.layerPoint.x) + sq(py - event.layerPoint.y))
    if (d < 20) return
    px = event.layerPoint.x
    py = event.layerPoint.y
    polyline.addLatLng(latlng)

    const pointCount = polyline.getLatLngs().length
    switch (options.geometryType) {
      case 'line-2pt': (pointCount === 2 ? done : () => {})()
    }
  }

  const tracker = new L.Marker(map.getCenter(), { icon }).addTo(layerGroup)
  tracker.on('click', append)
  tracker.on('dblclick', done)

  const updateTracker = latlng => {
    tracker.setLatLng(latlng)
    const latlngs = polyline.getLatLngs()
    if (latlngs.length > 0) {
      hintline.setLatLngs([latlngs[latlngs.length - 1], latlng])
    }
  }

  const handle = event => {
    // TODO: handle keydown:delete to remove last point
    switch (event.type) {
      case 'keydown:escape': return map.tools.dispose()
      case 'keydown:return': return done()
      case 'mousemove': return updateTracker(event.latlng)
    }
  }

  const dispose = () => {
    evented.emit('OSD_MESSAGE', { message: '' })
    map.removeLayer(layerGroup)
  }

  return { name: 'draw', handle, dispose }
}

/**
 * Edit Tool.
 */
const editTool = map => editor => {

  const dispose = () => editor.dispose()

  const handle = event => {
    switch (event.type) {
      case 'keydown:escape': return map.tools.dispose()
      case 'click':
      case 'keydown:return': return map.tools.dispose()
    }
  }

  return { name: 'edit', handle, dispose }
}

/**
 * Pick coordinate tool.
 */
const pointInput = map => options => {

  const prompt = options.prompt || ''
  evented.emit('OSD_MESSAGE', { message: prompt })
  const container = map._container
  const originalCursor = container.style.cursor
  container.style.cursor = 'crosshair'

  const click = event => {
    options.picked && options.picked(event.latlng)
    const message = options.message || ''
    evented.emit('OSD_MESSAGE', { message, duration: 1500 })
    map.tools.dispose()
  }

  const handle = event => {
    switch (event.type) {
      case 'click': return click(event)
      case 'keydown:escape': return map.tools.dispose()
    }
  }

  const dispose = () => {
    container.style.cursor = originalCursor
    evented.emit('OSD_MESSAGE', { message: '' })
  }

  return { name: 'point-input', handle, dispose }
}

L.Map.addInitHook(function () {
  let tool = selectionTool(this)

  const swap = toolFactory => {
    tool.dispose()
    tool = toolFactory()
  }

  const command = event => tool.handle(event)
  const dispose = () => swap(() => selectionTool(this))
  const draw = options => swap(() => drawTool(this)(options))
  const edit = editor => swap(() => editTool(this)(editor))
  const pickPoint = options => swap(() => pointInput(this)(options))

  const click = event => {
    // Only respond to click events from map:
    if (event.originalEvent.target !== this._container) return
    command(event)
  }

  this.on('click', click)
  this.on('mousemove', event => command(event))
  Mousetrap.bind('escape', _ => command({ type: 'keydown:escape' }))
  Mousetrap.bind('return', _ => command({ type: 'keydown:return' }))
  Mousetrap.bind(['del', 'mod+backspace'], _ => command({ type: 'keydown:delete' }))
  evented.on('tools.pick-point', options => pickPoint(options))
  evented.on('tools.draw', options => draw(options))

  this.tools = {
    disableMapClick: () => this.off('click', click),
    enableMapClick: () => setImmediate(() => this.on('click', click)),

    command,
    dispose,
    draw,
    edit,
    pickPoint
  }
})

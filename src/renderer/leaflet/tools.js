import L from 'leaflet'
import selection from '../components/App.selection'
import clipboard from '../components/App.clipboard'

import evented from '../evented'

/* Do-nothing tool. */
const selectionTool = _ => ({
  name: 'select',
  handle: event => {
    switch (event.type) {
      case 'clipboard:paste': return clipboard.paste()
    }
  },
  dispose: () => {}
})

/**
 * Draw Tool.
 */
const drawTool = map => (type, options) => {
  selection.deselect()

  const create = event => {
    options.create(event)
  }

  map.once('pm:create', create)
  map.pm.enableDraw(type, options)

  const dispose = () => {
    map.off('pm:create', create)
  }

  const handle = event => {
    switch (event.type) {
      case 'keydown:escape': return map.tools.dispose()
    }
  }

  return {
    name: 'draw',
    handle,
    dispose
  }
}

/**
 * Edit Tool.
 */
const editTool = map => (layer, options) => {
  const snapshot = layer.toGeoJSON()
  const latlngs = layer.getLatLngs ? layer.getLatLngs() : layer.getLatLng()
  const edit = event => {
    const { target } = event
    layer.fire('tools:edit', target.toGeoJSON())
  }

  layer.on('pm:edit', edit)
  const preventMarkerRemoval = layer.feature.geometry.type === 'Point'
  layer.pm.enable({ preventMarkerRemoval })

  const dispose = () => {
    layer.off('pm:edit', edit)
    selection.deselect()
    layer.pm.disable()
  }

  const handle = event => {
    switch (event.type) {
      case 'clipboard:copy': return clipboard.copy()
      case 'clipboard:cut': return clipboard.cut()
      case 'clipboard:paste': return clipboard.paste()
      case 'keydown:escape':
        layer.fire('tools:edit', snapshot)
        layer.setLatLngs ? layer.setLatLngs(latlngs) : layer.setLatLng(latlngs)
        return map.tools.dispose()
      case 'click':
      case 'keydown:return': return map.tools.dispose()
      case 'keydown:delete':
        selection.selected()
          .filter(selected => selected.delete)
          .forEach(selected => selected.delete())
        return map.tools.dispose()
    }
  }

  return {
    name: 'edit',
    handle,
    dispose
  }
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

  return {
    name: 'pick-point',
    handle,
    dispose
  }
}

L.Map.addInitHook(function () {
  let tool = selectionTool(this)

  const click = event => {
    // Only respond to click events from map:
    if (event.originalEvent.target !== this._container) return
    tool.handle(event)
  }

  const dblclick = event => {
    tool.handle(event)
  }

  this.on('click', click)
  this.on('dblclick', dblclick)

  const swap = (name, newTool) => {
    console.log('[tools]', name)
    tool.dispose()
    tool = newTool
  }

  const command = event => {
    console.log('[tools] command', tool.name, event)
    tool.handle(event)
  }

  const dispose = () => swap('tool:select', selectionTool(this))
  const draw = (type, options) => swap('tool:draw', drawTool(this)(type, options))
  const edit = (feature, options) => swap('tool:edit', editTool(this)(feature, options))
  const pickPoint = options => swap('tool:pick', pointInput(this)(options))

  this.tools = {
    command,
    dispose,
    draw,
    edit,
    pickPoint
  }
})

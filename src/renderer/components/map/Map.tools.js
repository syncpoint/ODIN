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
const drawTool = map => (type, options) => {
  return {
    name: 'draw',
    handle: command => console.log('[draw] handle', command),
    dispose: () => console.log('[draw] dispose')
  }
}

/**
 * Edit Tool.
 */
const editTool = map => editor => {

  const dispose = reset => {
    editor.dispose(reset)
  }

  const handle = event => {
    switch (event.type) {
      case 'keydown:escape': return map.tools.dispose(true)
      case 'click':
      case 'keydown:return': return map.tools.dispose(false)
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
    name: 'point-input',
    handle,
    dispose
  }
}

L.Map.addInitHook(function () {
  let tool = selectionTool(this)

  const swap = (reset, newTool) => {
    tool.dispose(reset)
    tool = newTool
  }

  const command = event => tool.handle(event)
  const dispose = reset => swap(reset, selectionTool(this))
  const draw = (type, options) => swap(false, drawTool(this)(type, options))
  const edit = editor => swap(false, editTool(this)(editor))
  const pickPoint = options => swap(false, pointInput(this)(options))

  const click = event => {
    // Only respond to click events from map:
    if (event.originalEvent.target !== this._container) return
    command(event)
  }

  this.on('click', click)
  Mousetrap.bind(['escape'], _ => command({ type: 'keydown:escape' }))
  Mousetrap.bind(['return'], _ => command({ type: 'keydown:return' }))
  evented.on('tools.pick-point', options => pickPoint(options))

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

import L from 'leaflet'
import selection from '../App.selection'
import clipboard from '../App.clipboard'
import evented from '../../evented'

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

  const dispose = () => {
    editor.dispose()
    selection.deselect()
  }

  const handle = event => {
    switch (event.type) {
      case 'clipboard:copy': return clipboard.copy()
      case 'clipboard:cut': return clipboard.cut()
      case 'clipboard:paste': return clipboard.paste()
      case 'keydown:escape':
        // TODO: reset geometry to original snapshot
        console.log('keydown:escape')
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
    name: 'point-input',
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

  const swap = newTool => {
    console.log('[tools]', newTool.name)
    tool.dispose()
    tool = newTool
  }

  const command = event => tool.handle(event)

  const dispose = () => swap(selectionTool(this))
  const draw = (type, options) => swap(drawTool(this)(type, options))
  const edit = editor => swap(editTool(this)(editor))
  const pickPoint = options => swap(pointInput(this)(options))

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

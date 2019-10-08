import Mousetrap from 'mousetrap'
import L from 'leaflet'
import evented from '../../evented'
import selection from '../App.selection'
import selectionTool from './tool-selection'
import drawTool from './tool-draw'
import editTool from './tool-edit'
import pickTool from './tool-pick'


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
  const pickPoint = options => swap(() => pickTool(this)(options))

  const click = event => {
    // Only respond to click events from map:
    if (event.originalEvent.target !== this._container) return
    command(event)
  }

  this.on('click', click)
  Mousetrap.bind('escape', _ => command({ type: 'keydown:escape' }))
  Mousetrap.bind('return', _ => command({ type: 'keydown:return' }))
  Mousetrap.bind(['del', 'mod+backspace'], _ => command({ type: 'keydown:delete' }))
  evented.on('tools.pick-point', options => pickPoint(options))
  evented.on('tools.draw', options => draw(options))
  selection.on('deselected', _ => command({ type: 'deselected' }))

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

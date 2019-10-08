import evented from '../../evented'

/**
 * Pick coordinate tool.
 */
export default map => options => {

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

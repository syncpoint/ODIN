import evented from '../evented'
import { ipcRenderer } from 'electron'

const pngExport = async map => {
  // this is a web application, so there is a global object "document"
  const mapCanvas = document.createElement('canvas')
  const [width, heigth] = map.getSize()
  mapCanvas.width = width
  mapCanvas.height = heigth

  const mapContext = mapCanvas.getContext('2d')
  document.querySelectorAll('.ol-layer canvas').forEach(canvas => {
    if (canvas.width > 0) {
      const opacity = canvas.parentNode.style.opacity
      mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity)
      const transform = canvas.style.transform
      // Get the transform parameters from the style's transform matrix
      const matrix = transform.match(/^matrix\(([^(]*)\)$/)[1].split(',').map(Number)
      // Apply the transform to the export map context
      CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix)
      mapContext.drawImage(canvas, 0, 0)
    }
  })
  const pngImageData = mapCanvas.toDataURL().replace(/^data:image\/png;base64,/, '')
  ipcRenderer.send('IPC_SHARE_PNG', pngImageData)
}

export default map => {
  evented.on('SHARE_PNG', () => {
    pngExport(map)
  })
}

import { MouseWheelZoom, PinchZoom, DragZoom, KeyboardZoom } from 'ol/interaction'
import { fromLonLat, getPointResolution } from 'ol/proj'

import evented from '../../evented'

const paperSizes = {
  a4: {
    landscape: {
      width: 297,
      height: 210
    }
  },
  a3: {
    landscape: {
      width: 420,
      height: 297
    }
  },
  a2: {
    landscape: {
      width: 594,
      heigth: 420
    }
  }
}

const dpi = {
  low: 96,
  medium: 2 * 96,
  high: 3 * 96
}
const selectedDPI = 'medium'

const padding = {
  left: 5,
  right: 5,
  top: 20,
  bottom: 5
}

const inch2mm = 25.4

/***********************/


const setZoomInteractions = (map, active = true) => {
  map.getInteractions().forEach(interaction => {
    if (interaction instanceof MouseWheelZoom) interaction.setActive(active)
    else if (interaction instanceof KeyboardZoom) interaction.setActive(active)
    else if (interaction instanceof PinchZoom) interaction.setActive(active)
    else if (interaction instanceof DragZoom) interaction.setActive(active)
  })
}


const showPrintArea = (map, props) => {

  /* thse values correspond with the physical dimensions of the paper and the pixel density */
  const desiredMapWidth = (paperSizes[props.paperFormat].landscape.width - (padding.left + padding.right)) / inch2mm * dpi[selectedDPI]
  const desiredMapHeight = (paperSizes[props.paperFormat].landscape.height - (padding.top + padding.bottom)) / inch2mm * dpi[selectedDPI]

  /* ratio differs from the typical A* paper ratios because it honors the padding values! */
  const ratio = desiredMapWidth / desiredMapHeight


  const scaleResolution = props.scale / getPointResolution(map.getView().getProjection(), dpi[selectedDPI] / inch2mm, map.getView().getCenter())

  const limitingDimension = (window.innerHeight <= window.innerWidth) ? 'innerHeight' : 'innerWidth'

  const limitingMargin = Math.floor(0.25 * window[limitingDimension])
  const printArea = document.getElementById('printArea')

  const height = window.innerHeight - 2 * limitingMargin
  const width = Math.floor(ratio * height)

  printArea.style.height = `${height}px`
  printArea.style.width = `${width}px`
  printArea.style.visibility = 'visible'

  const currentSizeResolution = height / desiredMapHeight
  map.getView().setResolution(scaleResolution / currentSizeResolution)
  setZoomInteractions(map, false)
}

const hidePrintArea = map => {
  const printArea = document.getElementById('printArea')
  printArea.style.visibility = 'hidden'
  setZoomInteractions(map, true)
}

const executePrint = map => {

}

const print = map => {
  evented.on('PRINT_SHOW_AREA', props => showPrintArea(map, props))
  evented.on('PRINT_HIDE_AREA', () => hidePrintArea(map))
  evented.on('PRINT_EXECUTE', props => executePrint(map, props))
}

export default print

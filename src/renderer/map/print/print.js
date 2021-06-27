import { MouseWheelZoom, PinchZoom, DragZoom, KeyboardZoom } from 'ol/interaction'
import { getPointResolution } from 'ol/proj'

import domtoimage from 'dom-to-image-more'
import jsPDF from 'jspdf'

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

  console.dir({ desiredMapWidth, desiredMapHeight })

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

const executePrint = (map, props) => {

  const previousSettings = {
    mapSize: map.getSize(),
    viewResolution: map.getView().getResolution(),
    viewCenter: map.getView().getCenter()
  }

  // execute this after the map ist rendered
  map.once('rendercomplete', () => {

    const perform = async () => {
      const exportOptions = {
        filter: function (element) {
          const className = element.className || ''
          return (className.indexOf('ol-scale-bar') < 0 && className.indexOf('ol-attribution') < 0)
        }
      }

      try {
        const dataURL = await domtoimage.toPng(map.getViewport(), exportOptions)
        console.log(`got a dataUrl with length ${dataURL.length}`)

        // eslint-disable-next-line new-cap
        const pdf = new jsPDF({ format: props.paperFormat, orientation: 'landscape' })
        const x = padding.left
        const y = padding.top
        const w = paperSizes[props.paperFormat].landscape.width - (padding.left + padding.right)
        const h = paperSizes[props.paperFormat].landscape.height - (padding.top + padding.bottom)
        pdf.addImage(dataURL, 'PNG', x, y, w, h)

        const scaleText = `1:${props.scale}000`
        pdf.text(scaleText, (paperSizes[props.paperFormat].landscape.width - padding.right), 15, { align: 'right' })

        await pdf.save('map.pdf', { returnPromise: true })
      } catch (error) {
        console.error(error)
      } finally {
        // restore styling
        map.getTargetElement().style = 'fixed'
        map.getTargetElement().style.width = ''
        map.getTargetElement().style.height = ''
        map.updateSize()
        map.getView().setResolution(previousSettings.viewResolution)
        map.getView().setCenter(previousSettings.viewCenter)
      }
    }

    perform()

  })

  // calculate center of print area on the screen
  const printArea = document.getElementById('printArea')
  const rect = printArea.getBoundingClientRect()
  const centerOnScreen = [rect.left + Math.floor(rect.width / 2), rect.top + Math.floor(rect.height / 2)]
  const centerCoordinates = map.getCoordinateFromPixel(centerOnScreen)
  // console.dir(toLonLat(centerCoordinates))

  /* these values correspond with the physical dimensions of the paper and the pixel density */
  const desiredMapWidth = (paperSizes[props.paperFormat].landscape.width - (padding.left + padding.right)) / inch2mm * dpi[selectedDPI]
  const desiredMapHeight = (paperSizes[props.paperFormat].landscape.height - (padding.top + padding.bottom)) / inch2mm * dpi[selectedDPI]

  const scaleResolution = props.scale / getPointResolution(map.getView().getProjection(), dpi[selectedDPI] / inch2mm, centerCoordinates)

  map.getView().setCenter(centerCoordinates)
  // required in order to allow the <map /> element to grow to the desired size
  map.getTargetElement().style.position = 'static'
  map.getTargetElement().style.width = `${Math.floor(desiredMapWidth)}px`
  map.getTargetElement().style.height = `${Math.floor(desiredMapHeight)}px`
  map.updateSize()
  map.getView().setResolution(scaleResolution)
}

const print = map => {
  evented.on('PRINT_SHOW_AREA', props => showPrintArea(map, props))
  evented.on('PRINT_HIDE_AREA', () => hidePrintArea(map))
  evented.on('PRINT_EXECUTE', props => executePrint(map, props))
}

export default print

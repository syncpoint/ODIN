import { MouseWheelZoom, PinchZoom, DragZoom, KeyboardZoom } from 'ol/interaction'
import { getPointResolution, toLonLat } from 'ol/proj'

import domtoimage from 'dom-to-image-more'
import jsPDF from 'jspdf'

import evented from '../../evented'
import getCurrentDateTime from '../../../shared/militaryTime'
import coordinateFormat from '../../../shared/coord-format'

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
      height: 420
    }
  }
}

const dpi = {
  low: 96,
  medium: 2 * 96,
  high: 3 * 96
}

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

const savePNG = (dataURL, fileName) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataURL
  link.click()
  setTimeout(() => link.remove(), 300)
}


const showPrintArea = (map, props) => {

  /* thse values correspond with the physical dimensions of the paper and the pixel density */
  const desiredMapWidth = (paperSizes[props.paperFormat].landscape.width - (padding.left + padding.right)) / inch2mm * dpi[props.quality]
  const desiredMapHeight = (paperSizes[props.paperFormat].landscape.height - (padding.top + padding.bottom)) / inch2mm * dpi[props.quality]


  /* ratio differs from the typical A* paper ratios because it honors the padding values! */
  const ratio = desiredMapWidth / desiredMapHeight

  const scaleResolution = props.scale / getPointResolution(map.getView().getProjection(), dpi[props.quality] / inch2mm, map.getView().getCenter())

  const limitingDimension = (window.innerHeight <= window.innerWidth) ? 'innerHeight' : 'innerWidth'

  const limitingMargin = Math.floor(0.15 * window[limitingDimension])
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
  console.log('hiding print area, reactivation zoom interactions')
  setZoomInteractions(map, true)
}

// returns a promise
const executePrint = async (map, props) => {

  const previousSettings = {
    mapSize: map.getSize(),
    viewResolution: map.getView().getResolution(),
    viewCenter: map.getView().getCenter()
  }

  const printArea = document.getElementById('printArea')
  printArea.style.visibility = 'hidden'
  // printArea.parentElement.style.backdropFilter = 'blur(25px)'

  // calculate center of print area on the screen
  const rect = printArea.getBoundingClientRect()
  const centerOnScreen = [rect.left + Math.floor(rect.width / 2), rect.top + Math.floor(rect.height / 2)]
  const centerCoordinates = map.getCoordinateFromPixel(centerOnScreen)

  /* these values correspond with the physical dimensions of the paper and the pixel density */
  const desiredMapWidth = (paperSizes[props.paperFormat].landscape.width - (padding.left + padding.right)) / inch2mm * dpi[props.quality]
  const desiredMapHeight = (paperSizes[props.paperFormat].landscape.height - (padding.top + padding.bottom)) / inch2mm * dpi[props.quality]

  const scaleResolution = props.scale / getPointResolution(map.getView().getProjection(), dpi[props.quality] / inch2mm, centerCoordinates)

  map.getView().setCenter(centerCoordinates)
  // required in order to allow the <map /> element to grow to the desired size
  map.getTargetElement().style.position = 'static'
  map.getTargetElement().style.width = `${Math.floor(desiredMapWidth)}px`
  map.getTargetElement().style.height = `${Math.floor(desiredMapHeight)}px`
  map.updateSize()
  map.getView().setResolution(scaleResolution)

  return new Promise((resolve, reject) => {
    // execute this after the map ist rendered
    map.once('rendercomplete', async () => {

      // omit these OpenLayers elements
      const exportOptions = {
        filter: function (element) {
          const className = element.className || ''
          return (className.indexOf('ol-scale-bar') < 0 && className.indexOf('ol-attribution') < 0)
        }
      }

      try {
        const dateTimeOfPrinting = getCurrentDateTime()
        const dataURL = await domtoimage.toPng(map.getViewport(), exportOptions)
        console.log(`got a dataUrl with length ${dataURL.length}`)

        // just save the "raw" PNG
        if (props.targetOutputFormat === 'PNG') {
          savePNG(dataURL, `${dateTimeOfPrinting}.png`)
          return resolve(true)
        }

        // from here it's all about creating a beautiful PDF
        // eslint-disable-next-line new-cap
        const pdf = new jsPDF({ format: props.paperFormat, orientation: 'landscape' })
        const x = padding.left
        const y = padding.top
        const w = paperSizes[props.paperFormat].landscape.width - (padding.left + padding.right)
        const h = paperSizes[props.paperFormat].landscape.height - (padding.top + padding.bottom)
        pdf.addImage(dataURL, 'PNG', x, y, w, h)

        // scale text in the upper right corner of the header
        const scaleText = `1 : ${props.scale}000`
        pdf.text(scaleText, (paperSizes[props.paperFormat].landscape.width - padding.right), padding.top - 2, { align: 'right' })

        // date/time of printing in the upper left corner of the header
        pdf.text(dateTimeOfPrinting, padding.left, padding.top - Math.floor(padding.top / 2))

        // place center of map coordinates in the upper left corner of the header
        const centerAsLonLat = toLonLat(centerCoordinates, map.getView().getProjection())
        pdf.text(coordinateFormat.format({ lng: centerAsLonLat[0], lat: centerAsLonLat[1] }), padding.left, padding.top - 2)

        // scale bar lower left corner ON THE map
        const scaleBarHeight = 2
        const scaleBarSegmentWidth = 10
        pdf.setDrawColor(0, 0, 0)

        pdf.setFillColor(255, 255, 255)
        pdf.rect(
          padding.left + scaleBarHeight / 2,
          paperSizes[props.paperFormat].landscape.height - padding.bottom - 2.5 * scaleBarHeight,
          5.25 * scaleBarSegmentWidth,
          2 * scaleBarHeight,
          'FD'
        )

        // black segments
        pdf.setFillColor(0, 0, 0)
        pdf.rect(padding.left + scaleBarHeight, paperSizes[props.paperFormat].landscape.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')
        pdf.rect(padding.left + scaleBarHeight + 2 * scaleBarSegmentWidth, paperSizes[props.paperFormat].landscape.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')

        // white segments
        pdf.setFillColor(255, 255, 255)
        pdf.rect(padding.left + scaleBarHeight + scaleBarSegmentWidth, paperSizes[props.paperFormat].landscape.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')
        pdf.rect(padding.left + scaleBarHeight + 3 * scaleBarSegmentWidth, paperSizes[props.paperFormat].landscape.height - padding.bottom - 2 * scaleBarHeight, scaleBarSegmentWidth, scaleBarHeight, 'FD')

        // real length of scale bar in (k)m
        const realLifeLength = props.scale * 0.04
        pdf.setFontSize(scaleBarHeight * 4)
        pdf.text(`${realLifeLength < 1 ? realLifeLength * 1000 : realLifeLength}${realLifeLength >= 1 ? 'k' : ''}m`,
          padding.left + 4 * scaleBarSegmentWidth + 2 * scaleBarHeight,
          paperSizes[props.paperFormat].landscape.height - padding.bottom - scaleBarHeight
        )

        await pdf.save(`map-${dateTimeOfPrinting}.pdf`, { returnPromise: true })
      } catch (error) {
        console.error(error)
        return reject(error)
      } finally {
        // restore styling
        printArea.style.visibility = 'visible'
        // printArea.parentElement.style.backdropFilter = 'none'
        map.getTargetElement().style = 'fixed'
        map.getTargetElement().style.width = ''
        map.getTargetElement().style.height = ''
        map.updateSize()
        map.getView().setResolution(previousSettings.viewResolution)
        map.getView().setCenter(previousSettings.viewCenter)

        // tell everyone that we're done
        resolve(true)
      }
    })
  })
}

const print = map => {
  evented.on('PRINT_SHOW_AREA', props => showPrintArea(map, props))
  evented.on('PRINT_EXECUTE', props => executePrint(map, props)
    .then(() => evented.emit('PRINT_EXECUTION_DONE'))
    .catch(error => console.error(error))
  )
  evented.on('PRINT_HIDE_AREA', () => hidePrintArea(map))
}

export default print

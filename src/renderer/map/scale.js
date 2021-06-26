
import evented from '../evented'
import { fromLonLat, getPointResolution } from 'ol/proj'


import domtoimage from 'dom-to-image-more'
import jsPDF from 'jspdf'


const paperSizes = {
  a4: {
    landscape: {
      width: 297,
      height: 210
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

const scale = 25 // 1/25000

const inch2mm = 25.4

const selectedDPI = 'medium'

// Fertörakos
const center = [16.672721, 47.715263]


const exportOptions = {
  filter: function (element) {
    const className = element.className || ''
    return (className.indexOf('ol-scale-bar') < 0 && className.indexOf('ol-attribution') < 0)
  }
}

const generatePDF = map => {


  const previousValues = {
    map: {
      size: map.getSize(),
      view: {
        resolution: map.getView().getResolution()
      }
    }
  }

  const onRenderComplete = function (event) {
    console.log('rendering completed')
    console.dir(event)

    const doit = async () => {
      try {
        const dataURL = await domtoimage.toPng(map.getViewport(), exportOptions)
        console.log(`got a dataUrl with length ${dataURL.length}`)

        // eslint-disable-next-line new-cap
        const pdf = new jsPDF({ orientation: 'landscape' })
        const x = padding.left
        const y = padding.top
        const w = paperSizes.a4.landscape.width - (padding.left + padding.right)
        const h = paperSizes.a4.landscape.height - (padding.top + padding.bottom)
        pdf.addImage(dataURL, 'PNG', x, y, w, h)

        const scaleText = '1:25000'

        pdf.text(scaleText, (paperSizes.a4.landscape.width - padding.right), 15, { align: 'right' })

        await pdf.save('map.pdf', { returnPromise: true })
        console.log('passed pdf.save(...)')
      } catch (error) {
        console.error(error)
      } finally {
        map.getTargetElement().style.width = ''
        map.getTargetElement().style.height = ''
        map.updateSize()
        map.getView().setResolution(previousValues.map.view.resolution)
      }
    }

    doit()
  }


  // Set print size

  const mapWidth = (paperSizes.a4.landscape.width - (padding.left + padding.right)) / inch2mm * dpi[selectedDPI]
  const mapHeight = (paperSizes.a4.landscape.height - (padding.top + padding.bottom)) / inch2mm * dpi[selectedDPI]

  map.getView().setCenter(fromLonLat(center))
  // map.getView().setRotation(-0.025)

  const scaleResolution = scale / getPointResolution(map.getView().getProjection(), dpi[selectedDPI] / inch2mm, map.getView().getCenter())


  map.getTargetElement().style.width = mapWidth + 'px'
  map.getTargetElement().style.height = mapHeight + 'px'
  map.updateSize()

  map.once('rendercomplete', onRenderComplete)
  map.getView().setResolution(scaleResolution)

  console.log('should print now ...')
}

export default map => {
  evented.on('SET_SCALE_TO_50k', () => {
    generatePDF(map)
  })
}

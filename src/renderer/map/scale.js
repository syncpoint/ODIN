
import evented from '../evented'
import { getPointResolution } from 'ol/proj'

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

const generatePDF = (map, scaleBar) => {
  const previousValues = {
    map: {
      size: map.getSize(),
      view: {
        resolution: map.getView().getResolution()
      }
    }
  }
  // console.dir(previousValues)

  const mapWidth = (paperSizes.a4.landscape.width - (padding.left + padding.rigth)) / inch2mm * dpi[selectedDPI]
  const mapHeight = (paperSizes.a4.landscape.height - (padding.top + padding.bottom)) / inch2mm * dpi[selectedDPI]

  const scaleResolution = scale / getPointResolution(map.getView().getProjection(), dpi[selectedDPI] / inch2mm, map.getView().getCenter())

  map.once('postrender', event => {
    console.log('rendering completed')
    console.dir(event)

    const doit = () => {
      domtoimage.toJpeg(map.getViewport())
        .then(dataURL => {
          console.log(`got a dataUrl with length ${dataURL.length}`)
          // fs.promises.writeFile('/Users/thomas/Desktop/map.jpeg', dataURL.replace(/^data:image\/jpeg;base64,/, ''), { encoding: 'base64' }).then(console.log('done')).catch(error => console.error(error))
          // eslint-disable-next-line new-cap
          const pdf = new jsPDF({ orientation: 'landscape' })
          const x = padding.left
          const y = padding.top
          const w = paperSizes.a4.landscape.width - (padding.left + padding.right)
          const h = paperSizes.a4.landscape.height - (padding.top + padding.bottom)
          pdf.addImage(dataURL, 'JPEG', x, y, w, h)

          // pdf.addImage(dataURL, 'JPEG', padding.left, padding.top, paperSizes.a4.landscape.width - (padding.left + padding.right), paperSizes.a4.landscape.height - (padding.top + padding.bottom))
          // pdf.circle(100, 100, 50)
          pdf.save('map.pdf', { returnPromise: true }).catch(error => console.error(error))
          map.getTargetElement().style.width = ''
          map.getTargetElement().style.height = ''
          map.updateSize()
          map.getView().setResolution(previousValues.map.view.resolution)
          scaleBar.setDpi()
        })
        .catch(error => console.error(error))
    }

    setTimeout(doit, 100)
  })

  // Set print size
  map.getTargetElement().style.width = mapWidth + 'px'
  map.getTargetElement().style.height = mapHeight + 'px'
  map.updateSize()
  map.getView().setResolution(scaleResolution)
  scaleBar.setDpi(scaleResolution)
  console.log('should print now ...')
}

export default (map, scaleBar) => {
  evented.on('SET_SCALE_TO_50k', () => {
    generatePDF(map, scaleBar)
  })
}

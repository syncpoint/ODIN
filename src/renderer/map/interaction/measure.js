import Draw from 'ol/interaction/Draw'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Overlay from 'ol/Overlay'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Circle as CircleStyle, Fill, Stroke, Style, Text as TextStyle } from 'ol/style'
import Circle from 'ol/geom/Circle'
import GeometryType from 'ol/geom/GeometryType'
import evented from '../../evented'

const meterFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 2, style: 'unit', unit: 'meter' })
const kilometerFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 2, style: 'unit', unit: 'kilometer' })

const formatLength = length => {
  if (length < 1000) {
    return meterFormatter.format(length)
  }
  return kilometerFormatter.format(length / 1000)
}

const LINE_STRING_TEXT_STYLE = new TextStyle({
  font: '16px sans-serif',
  fill: new Fill({
    color: 'black'
  }),
  textAlign: 'end',
  placement: 'line',
  overflow: true,
  textBaseline: 'bottom'
})

const DEFAULT_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)'
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    })
  }),
  text: LINE_STRING_TEXT_STYLE
})

const source = new VectorSource()

const vector = new VectorLayer({
  source: source,
  style: DEFAULT_STYLE
})



const measureOptions = {
  type: GeometryType.LINE_STRING,
  source: source,
  style: DEFAULT_STYLE
}

const getLastSegmentCoordinates = lineStringGeometry => {
  const coordinates = lineStringGeometry.getCoordinates()
  if (coordinates.length <= 2) return coordinates
  return [coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]]
}

const createMeasureOverlay = () => {
  const overlayElement = document.createElement('div')
  overlayElement.className = 'ol-tooltip'
  overlayElement.style = 'font: 16px sans-serif'
  const measureOverlay = new Overlay({
    element: overlayElement,
    offset: [20, 5],
    positioning: 'center-left'
  })
  return measureOverlay
}


export default map => {
  map.getLayers().push(vector)
  evented.on('MAP_MEASURE_LENGTH', () => {

    const circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
    const measureOverlay = createMeasureOverlay()


    const handleLineStringChanged = event => {
      const lineStringGeometry = event.target.getGeometry()
      const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

      measureOverlay.getElement().innerHTML = `${formatLength(lastSegment.getLength())}/${formatLength(lineStringGeometry.getLength())}`
      measureOverlay.setPosition(lineStringGeometry.getLastCoordinate())


      circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
    }

    const interaction = new Draw(measureOptions)

    interaction.on('drawstart', event => {
      source.addFeature(circleFeature)
      map.addOverlay(measureOverlay)
      const feature = event.feature
      feature.on('change', handleLineStringChanged)
    })

    interaction.on('drawend', event => {

      source.removeFeature(circleFeature)

      event.feature.un('change', handleLineStringChanged)
      event.feature.setStyle(DEFAULT_STYLE)
      event.feature.getStyle().getText().setText(formatLength(event.feature.getGeometry().getLength()))

      map.removeOverlay(measureOverlay)
      map.removeInteraction(interaction)

    })
    map.addInteraction(interaction)
  })
}

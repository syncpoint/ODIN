import Draw from 'ol/interaction/Draw'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Overlay from 'ol/Overlay'
import { getLength } from 'ol/sphere'
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
  geometry: GeometryType.LINE_STRING,
  font: '16px sans-serif',
  fill: new Fill({
    color: 'black'
  }),
  textAlign: 'end',
  placement: 'line',
  overflow: true,
  textBaseline: 'bottom'
})

const DEFAULT_STYLE = text => [
  new Style({
    stroke: new Stroke({
      color: 'red',
      width: 3
    })
  }),
  new Style({
    stroke: new Stroke({
      color: 'white',
      lineDash: [10, 10],
      width: 3
    })
  }),
  new Style({
    text: new TextStyle({
      font: '16px sans-serif',
      fill: new Fill({
        color: 'black'
      }),
      text: text,
      textAlign: 'end',
      placement: 'line',
      overflow: true,
      textBaseline: 'bottom'
    })
  }),
  new Style({
    geometry: GeometryType.POINT,
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      })
    })
  })
]


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
  const source = new VectorSource()
  const vector = new VectorLayer({
    source: source,
    style: DEFAULT_STYLE()
  })
  map.getLayers().push(vector)

  const interaction = new Draw({
    type: GeometryType.LINE_STRING,
    source: source,
    style: DEFAULT_STYLE()
  })

  evented.on('MAP_MEASURE_LENGTH', () => {

    const circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
    const measureOverlay = createMeasureOverlay()


    const handleLineStringChanged = event => {
      const lineStringGeometry = event.target.getGeometry()
      const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

      measureOverlay.getElement().innerHTML = `${formatLength(getLength(lastSegment))} / ${formatLength(getLength(lineStringGeometry))}`
      measureOverlay.setPosition(lineStringGeometry.getLastCoordinate())


      circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
    }

    interaction.on('drawstart', event => {
      source.addFeature(circleFeature)
      map.addOverlay(measureOverlay)
      const feature = event.feature
      feature.on('change', handleLineStringChanged)
    })

    interaction.on('drawend', event => {

      source.removeFeature(circleFeature)

      event.feature.un('change', handleLineStringChanged)
      event.feature.setStyle(DEFAULT_STYLE(formatLength(getLength(event.feature.getGeometry()))))
      measureOverlay.dispose()
      circleFeature.dispose()

      map.removeOverlay(measureOverlay)
      map.removeInteraction(interaction)

    })
    map.addInteraction(interaction)
  })
}

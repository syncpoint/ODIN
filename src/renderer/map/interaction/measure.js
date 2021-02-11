import Draw from 'ol/interaction/Draw'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
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

const styleFunction = feature => {
  const style = new Style({
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
    text: new TextStyle({
      font: '16px sans-serif',
      fill: new Fill({
        color: 'black'
      }),
      text: '',
      textAlign: 'end',
      placement: 'line',
      overflow: true,
      textBaseline: 'bottom'
    })
  })

  const geometry = feature.getGeometry()
  console.dir(geometry)
  /*
  if (geometry.getType() !== GeometryType.CIRCLE) return style
  style.getText().setText(formatLength(geometry.getRadius()))
  */

  if (geometry.getType() === GeometryType.LINE_STRING) {
    style.getText().setText(formatLength(geometry.getLength()))
  }

  return style
}


const source = new VectorSource()

const vector = new VectorLayer({
  source: source,
  style: styleFunction
})



const measureOptions = {
  type: GeometryType.LINE_STRING,
  source: source,
  style: styleFunction
}

const getLastSegmentCoordinates = lineStringGeometry => {
  const coordinates = lineStringGeometry.getCoordinates()
  if (coordinates.length <= 2) return coordinates
  return [coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]]
}

export default map => {
  map.getLayers().push(vector)
  evented.on('MAP_MEASURE_LENGTH', () => {

    const interaction = new Draw(measureOptions)
    const circleFeature = new Feature()

    interaction.on('drawstart', event => {
      source.addFeature(circleFeature)

      const feature = event.feature
      feature.on('change', event => {
        const lineStringGeometry = event.target.getGeometry()
        const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))
        circleFeature.setGeometry(new Circle(lastSegment.getFirstCoordinate(), lastSegment.getLength()))
      })
    })
    interaction.on('drawend', event => {
      source.removeFeature(circleFeature)
      map.removeInteraction(interaction)
    })
    map.addInteraction(interaction)
  })
}

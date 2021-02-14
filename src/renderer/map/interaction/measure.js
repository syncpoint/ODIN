import { Draw, Modify, Select } from 'ol/interaction'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Overlay from 'ol/Overlay'
import { getLength } from 'ol/sphere'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Fill, Stroke, Style, Text as TextStyle } from 'ol/style'
import Circle from 'ol/geom/Circle'
import GeometryType from 'ol/geom/GeometryType'
import uuid from 'uuid-random'
import evented from '../../evented'
import { registerHandler } from '../../clipboard'

const meterFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 2, style: 'unit', unit: 'meter' })
const kilometerFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 2, style: 'unit', unit: 'kilometer' })

const formatLength = length => {
  if (length < 1000) {
    return meterFormatter.format(length)
  }
  return kilometerFormatter.format(length / 1000)
}

const defaultStyle = text => [
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
  })
]

const selectedStyle = text => [
  new Style({
    stroke: new Stroke({
      color: 'blue',
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

  const selectedFeatures = new Collection()

  const source = new VectorSource()
  const vector = new VectorLayer({
    source: source,
    style: defaultStyle()
  })

  map.addLayer(vector)

  const selectionInteraction = new Select({
    hitTolerance: 3,
    layers: [vector],
    features: selectedFeatures,
    style: selectedStyle(),
    filter: feature => feature.getGeometry().getType() === GeometryType.LINE_STRING
  })
  selectionInteraction.on('select', event => {
    event.selected.forEach(lineString => lineString.setStyle(selectedStyle(formatLength(getLength(lineString.getGeometry())))))
    event.deselected.forEach(lineString => lineString.setStyle(defaultStyle(formatLength(getLength(lineString.getGeometry())))))
  })

  const drawInteraction = new Draw({
    type: GeometryType.LINE_STRING,
    source: source,
    style: defaultStyle()
  })

  const modifyInteraction = new Modify({
    features: selectedFeatures
  })
  modifyInteraction.on('modifyend', event => {
    const lineStrings = event.features.getArray()
    lineStrings.forEach(lineString => lineString.setStyle(selectedStyle(formatLength(getLength(lineString.getGeometry())))))
  })

  map.addInteraction(modifyInteraction)
  map.addInteraction(selectionInteraction)

  registerHandler('measure:', {
    delete: () => {
      selectedFeatures.getArray().forEach(feature => {
        source.removeFeature(feature)
      })
      selectedFeatures.clear()
    }
  })


  let circleFeature
  let measureOverlay


  const handleLineStringChanged = event => {
    const lineStringGeometry = event.target.getGeometry()
    const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

    measureOverlay.getElement().innerHTML = `${formatLength(getLength(lastSegment))} / ${formatLength(getLength(lineStringGeometry))}`
    measureOverlay.setPosition(lineStringGeometry.getLastCoordinate())
    circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
  }

  drawInteraction.on('drawstart', event => {
    circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
    source.addFeature(circleFeature)

    measureOverlay = createMeasureOverlay()
    map.addOverlay(measureOverlay)
    const feature = event.feature
    feature.on('change', handleLineStringChanged)
  })

  drawInteraction.on('drawend', event => {

    source.removeFeature(circleFeature)
    circleFeature.dispose()

    event.feature.un('change', handleLineStringChanged)
    event.feature.setStyle(defaultStyle(formatLength(getLength(event.feature.getGeometry()))))
    event.feature.setId(`measure:${uuid()}`)

    map.removeOverlay(measureOverlay)
    measureOverlay.dispose()

    map.removeInteraction(drawInteraction)

  })

  evented.on('MAP_MEASURE_LENGTH', () => {
    map.addInteraction(drawInteraction)
  })
}

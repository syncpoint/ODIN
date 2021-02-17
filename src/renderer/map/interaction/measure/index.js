import { Draw, Modify, Select } from 'ol/interaction'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Overlay from 'ol/Overlay'

import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import Circle from 'ol/geom/Circle'
import GeometryType from 'ol/geom/GeometryType'
import uuid from 'uuid-random'
import evented from '../../../evented'
import { registerHandler } from '../../../clipboard'
import { defaultStyle, selectedStyle } from './style'
import { length, getLastSegmentCoordinates, angle } from './tools'

const createMeasureOverlay = () => {
  const overlayElement = document.createElement('div')
  overlayElement.className = 'ol-tooltip'
  overlayElement.style = 'font: 16px sans-serif; background-color: hsl(0, 0%, 100%)'
  const measureOverlay = new Overlay({
    element: overlayElement,
    offset: [20, 5],
    positioning: 'center-left'
  })
  return measureOverlay
}

export default map => {

  /*  initialize OL container that will hold our
      measurement features
  */
  const selectedFeatures = new Collection()

  const source = new VectorSource()
  const vector = new VectorLayer({
    source: source,
    style: defaultStyle()
  })

  /*  ** SELECT ** */
  const selectionInteraction = new Select({
    hitTolerance: 3,
    layers: [vector],
    features: selectedFeatures,
    style: selectedStyle(),
    filter: feature => feature.getGeometry().getType() === GeometryType.LINE_STRING
  })
  selectionInteraction.on('select', event => {
    event.selected.forEach(lineString => lineString.setStyle(selectedStyle(length(lineString.getGeometry()))))
    event.deselected.forEach(lineString => lineString.setStyle(defaultStyle(length(lineString.getGeometry()))))
  })

  /*  ** MODIFY ** */
  const modifyInteraction = new Modify({
    features: selectedFeatures
  })
  modifyInteraction.on('modifyend', event => {
    const lineStrings = event.features.getArray()
    lineStrings.forEach(lineString => lineString.setStyle(selectedStyle(length(lineString.getGeometry()))))
  })

  /*  circle feature is is used for giving the user a visual feedback for the last segement of
      the measurement
  */
  let circleFeature
  let measureOverlay

  const handleLineStringChanged = event => {
    const lineStringGeometry = event.target.getGeometry()
    const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

    measureOverlay.getElement().innerHTML = `${length(lastSegment)} @ ${angle(lastSegment)} / ${length(lineStringGeometry)}`
    measureOverlay.setPosition(lineStringGeometry.getLastCoordinate())
    circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
  }

  /*  ** DRAW ** */
  const drawInteraction = new Draw({
    type: GeometryType.LINE_STRING,
    source: source,
    style: selectedStyle()
  })

  drawInteraction.on('drawstart', event => {
    circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
    circleFeature.setStyle(selectedStyle())
    source.addFeature(circleFeature)

    measureOverlay = createMeasureOverlay()
    map.addOverlay(measureOverlay)

    event.feature.on('change', handleLineStringChanged)
  })

  drawInteraction.on('drawend', event => {
    /*  when drawing ends get rid of the circle fature */
    source.removeFeature(circleFeature)
    circleFeature.dispose()

    event.feature.un('change', handleLineStringChanged)
    event.feature.setStyle(defaultStyle(length(event.feature.getGeometry())))
    /*  schema:id is required in order to make deleting a feature work */
    event.feature.setId(`measure:${uuid()}`)

    map.removeOverlay(measureOverlay)
    measureOverlay.dispose()

    map.removeInteraction(drawInteraction)
  })

  // vector layer contains all measurement features
  map.addLayer(vector)
  map.addInteraction(modifyInteraction)
  map.addInteraction(selectionInteraction)

  /*  hook into the clipboard handler in order to
      make use of globally registered (keyboard) shorcuts
      for deleting features
  */
  registerHandler('measure:', {
    copy: () => {},
    paste: () => {},
    cut: () => {
      selectedFeatures.getArray().forEach(feature => source.removeFeature(feature))
      selectedFeatures.clear()
    },
    delete: () => {
      selectedFeatures.getArray().forEach(feature => source.removeFeature(feature))
      selectedFeatures.clear()
    }
  })

  evented.on('MAP_MEASURE_LENGTH', () => {
    /* make this idempotent */
    if (map.getInteractions().getArray().includes(drawInteraction)) return
    /* gets removed when drawing ends */
    map.addInteraction(drawInteraction)
  })
}

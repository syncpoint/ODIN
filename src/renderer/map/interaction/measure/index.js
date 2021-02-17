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
import { angle, area, length, isSingleSegment, getLastSegmentCoordinates } from './tools'

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

const getLineStringText = feature => {
  const geometry = feature.getGeometry()
  return (isSingleSegment(geometry) ? `${length(geometry)} @ ${angle(geometry)}` : length(geometry))
}

const getPolygonText = feature => {
  const geometry = feature.getGeometry()
  return area(geometry)
}

const getTextFor = feature => (feature.getGeometry().getType() === GeometryType.LINE_STRING
  ? getLineStringText(feature)
  : getPolygonText(feature))


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
    filter: feature => (feature.getGeometry().getType() === GeometryType.LINE_STRING ||
      feature.getGeometry().getType() === GeometryType.POLYGON
    )
  })
  selectionInteraction.on('select', event => {
    event.selected.forEach(feature => feature.setStyle(selectedStyle(getTextFor(feature))))
    event.deselected.forEach(feature => feature.setStyle(defaultStyle(getTextFor(feature))))
  })

  /*  ** MODIFY ** */
  const modifyInteraction = new Modify({
    features: selectedFeatures
  })
  modifyInteraction.on('modifyend', event => {
    const features = event.features.getArray()
    features.forEach(feature => feature.setStyle(selectedStyle(getTextFor(feature))))
  })

  /*  circle feature is is used for giving the user a visual feedback for the last segement of
      the distance measurement
  */
  let circleFeature
  let measureOverlay

  /* reference to the current draw interaction */
  let currentDrawInteraction

  const handleLineStringChanged = event => {
    const lineStringGeometry = event.target.getGeometry()
    const lastSegment = new LineString(getLastSegmentCoordinates(lineStringGeometry))

    measureOverlay.getElement().innerHTML = `${length(lastSegment)} @ ${angle(lastSegment)} / ${length(lineStringGeometry)}`
    measureOverlay.setPosition(lineStringGeometry.getLastCoordinate())
    circleFeature.getGeometry().setCenterAndRadius(lastSegment.getFirstCoordinate(), lastSegment.getLength())
  }

  const handlePolygonChanged = event => {
    const geometry = event.target.getGeometry()
    console.dir(geometry)
    measureOverlay.getElement().innerHTML = area(geometry)
    measureOverlay.setPosition(geometry.getInteriorPoint().getCoordinates())
  }

  /*  ** DRAW ** */
  const createDrawInteraction = (map, geometryType) => {
    const drawInteraction = new Draw({
      type: geometryType,
      source: source,
      style: selectedStyle()
    })

    drawInteraction.on('drawstart', event => {
      if (geometryType === GeometryType.LINE_STRING) {
        /* circle helper is only supported when measuring distances */
        circleFeature = new Feature(new Circle({ x: 0, y: 0 }, 0))
        circleFeature.setStyle(selectedStyle())
        source.addFeature(circleFeature)

        event.feature.on('change', handleLineStringChanged)
      } else {
        event.feature.on('change', handlePolygonChanged)
      }

      measureOverlay = createMeasureOverlay()
      map.addOverlay(measureOverlay)
    })

    drawInteraction.on('drawend', event => {
      if (geometryType === GeometryType.LINE_STRING) {
        /*  when drawing ends get rid of the circle fature */
        source.removeFeature(circleFeature)
        circleFeature.dispose()

        event.feature.un('change', handleLineStringChanged)
      } else {
        event.feature.un('change', handlePolygonChanged)
      }
      event.feature.setStyle(defaultStyle(getTextFor(event.feature)))
      /*  schema:id is required in order to make deleting a feature work */
      event.feature.setId(`measure:${uuid()}`)

      map.removeOverlay(measureOverlay)
      measureOverlay.dispose()

      map.removeInteraction(drawInteraction)
      currentDrawInteraction = null
    })

    return drawInteraction
  }

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

  const addDrawInteraction = geometryType => {
    /* make this idempotent */
    if (currentDrawInteraction && map.getInteractions().getArray().includes(currentDrawInteraction)) {
      map.removeInteraction(currentDrawInteraction)
      currentDrawInteraction = null
    }
    /* gets removed when drawing ends */
    currentDrawInteraction = createDrawInteraction(map, geometryType)
    map.addInteraction(currentDrawInteraction)
  }

  evented.on('MAP_MEASURE_LENGTH', () => {
    addDrawInteraction(GeometryType.LINE_STRING)
  })

  evented.on('MAP_MEASURE_AREA', () => {
    addDrawInteraction(GeometryType.POLYGON)
  })
}

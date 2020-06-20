import * as R from 'ramda'
import { Interaction } from 'ol/interaction'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Collection from 'ol/Collection'
import * as geom from 'ol/geom'
import Feature from 'ol/Feature'
import { distance } from 'ol/coordinate'
import * as style from 'ol/style'
import Event from 'ol/events/Event'
import { coordinates, toLatLon, fromLatLon, wrap360 } from '../style/geodesy'

/**
 * Modify event with same interface as ol/interaction/Modify.
 */

const MODIFYSTART = 'modifystart'
const MODIFYEND = 'modifyend'

class ModifyEvent extends Event {
  constructor (type, features, event) {
    super(type)
    this.features = features
    this.mapBrowserEvent = event
  }
}

/**
 * Control handle styles.
 */

const white = [255, 255, 255, 1]
const blue = [0, 153, 255, 1]
const red = [255, 0, 0, 1]
const width = 3

const pointStyle = fillColor => [
  new style.Style({
    image: new style.Circle({
      radius: width * 2,
      fill: new style.Fill({ color: fillColor }),
      stroke: new style.Stroke({ color: white, width: width / 2 })
    }),
    zIndex: Infinity
  })
]

/**
 * point :: [number, number] -> ol/geom/Point
 * EPSG:3857 point geometry from EPSG:4326 coordinate.
 */
const point = latLon => new geom.Point(fromLatLon(latLon))

/**
 * createFrame :: ol/Feature -> Frame
 * Immutable geometry parameters (control points, angles and ranges).
 */
const createFrame = feature => {
  const bearingLine = (A, B) => [A.initialBearingTo(B), A.distanceTo(B)]
  const create = current => {
    const { C, angleA, rangeA, angleB, rangeB } = current
    const normA = wrap360(Number.parseFloat(angleA))
    const normB = wrap360(Number.parseFloat(angleB))
    const A = C.destinationPoint(rangeA, normA)
    const B = C.destinationPoint(rangeB, normB)

    return {
      points: [C, A, B],
      angleA: normA,
      rangeA,
      angleB: normB,
      rangeB,
      bearingLine: X => bearingLine(C, X),
      copy: properties => create({ ...current, ...properties })
    }
  }

  const [C, A, B] = coordinates(feature).map(toLatLon)
  const [angleA, rangeA] = bearingLine(C, A)
  const [angleB, rangeB] = bearingLine(C, B)
  return create({ C, angleA, rangeA, angleB, rangeB })
}

/**
 * handle :: [ol/geom/Geometry, fn] -> ol/Feature
 */
const handle = ([geometry, pointerdrag]) =>
  new Feature({ geometry, pointerdrag })

/**
 * handledrag :: [(Frame, ol/MapBrowserEvent) -> Frame]
 * Handle pointer drag event handlers.
 */
const handledrag = [
  (frame, { coordinate }) => {
    return frame.copy({ C: toLatLon(coordinate) })
  },
  (frame, { originalEvent, coordinate }) => {
    const [angleA, rangeA] = frame.bearingLine(toLatLon(coordinate))
    const rangeB = originalEvent.ctrlKey ? rangeA : frame.rangeB
    return frame.copy({ angleA, rangeA, rangeB })
  },
  (frame, { originalEvent, coordinate }) => {
    const [angleB, rangeB] = frame.bearingLine(toLatLon(coordinate))
    const rangeA = originalEvent.ctrlKey ? rangeB : frame.rangeA
    return frame.copy({ rangeA, angleB, rangeB })
  }
]

/**
 * controlFeatures :: Frame -> [ol/Feature]
 */
const controlFeatures = frame =>
  R.zip(frame.points.map(point), handledrag).map(handle)


const DONT_PROPAGATE = false
const PROPAGATE = true

/**
 * candidate :: (ol/MapBrowserEvent, [ol/Feature], number) -> ol/Feature
 * Handle under pointer (within given pixel tolerance).
 */
const candidate = ({ map, pixel }, [...handles], pixelTolerance) => {
  handles.forEach(feature => {
    const vertexCoodinate = coordinates(feature)
    const vertexPixel = map.getPixelFromCoordinate(vertexCoodinate)
    feature.set('distance', distance(pixel, vertexPixel))
  })

  const sortByDistance = (a, b) => a.get('distance') - b.get('distance')
  const candidate = handles.sort(sortByDistance)[0]
  return candidate.get('distance') <= pixelTolerance ? candidate : null
}

// Behavior :: { string -> (ol/MapBrowserEvent -> boolean)}
// DFA states (behaviors).
// Note: Event handlers are bound to modify interaction instance (execution context).

/**
 * pointerUp :: [ol/Feature] -> Behavior
 * Detect focused handle under pointer.
 */
const pointerUp = handles => {
  handles.forEach(feature => feature.setStyle(pointStyle(red)))

  return {
    pointermove (event) {
      const handle = candidate(event, handles, this.pixelTolerance)
      return handle
        ? this.become(focusHandle(handles, handle), DONT_PROPAGATE)
        : PROPAGATE
    }
  }
}

/**
 * focusHandle :: ([ol/Feature], ol/Feature) -> Behavior
 * Initiate drag sequence for focused handle on pointer down.
 */
const focusHandle = (handles, handle) => {
  handle.setStyle(pointStyle(blue))

  return {
    pointermove (event) {
      const handle = candidate(event, handles, this.pixelTolerance)
      return handle
        ? this.become(focusHandle(handles, handle), DONT_PROPAGATE)
        : this.become(pointerUp(handles), PROPAGATE)
    },

    pointerdown () {
      return this.become(dragHandle(handles, handle), DONT_PROPAGATE)
    }
  }
}

/**
 * dragHandle :: ([ol/Feature], ol/Feature) -> Behavior
 * Delegate point drag to event handler of control handle,
 * thus updating geometry frame.
 */
const dragHandle = (handles, handle) => {
  const pointerdrag = handle.get('pointerdrag')

  return {
    pointerup (event) {
      // Dispatch MODIFYEND.
      delete this.modified
      const modifyEvent = new ModifyEvent(MODIFYEND, this.features, event)
      this.dispatchEvent(modifyEvent)
      this.become(focusHandle(handles, handle))
      return DONT_PROPAGATE
    },

    pointerdrag (event) {
      // Delegate event and update frame, feature and handle geometries.
      this.frame = pointerdrag(this.frame, event)
      this.frame.points.forEach((p, i) => this.handles[i].setGeometry(point(p)))
      const coordinates = this.frame.points.map(fromLatLon)
      this.feature.getGeometry().setCoordinates(coordinates)

      // Dispatch MODIFYSTART once.
      if (!this.modified) {
        this.modified = true
        const modifyEvent = new ModifyEvent(MODIFYSTART, this.features, event)
        this.dispatchEvent(modifyEvent)
      }

      return DONT_PROPAGATE
    }
  }
}

/** Extract pixel tolerance from options (default: 10) */
const pixelTolerance = options =>
  options.pixelTolerance !== undefined
    ? options.pixelTolerance
    : 10

/** Extract feature collection from options source or collection. */
const featureCollection = options => {
  const features = options.source
    ? new Collection(options.source.getFeatures())
    : options.features

  // We expect exactly one feature (of correct type).
  if (!features) throw new Error('The modify interaction requires features or a source')
  if (features.getLength() !== 1) throw new Error('The modify interaction requires exactly one feature')
  return features
}

/**
 * Modify interaction specific to fan areas.
 * Note: Interaction is implemented as DFA.
 */
export class ModifyFan extends Interaction {

  constructor (options) {
    super(options)

    this.pixelTolerance = pixelTolerance(options)
    this.features = featureCollection(options)
    this.feature = this.features.getArray()[0]

    // Setup dedicated vector layer for control features.
    this.frame = createFrame(this.feature)
    this.handles = controlFeatures(this.frame)

    this.overlay = new VectorLayer({
      source: new VectorSource({
        features: this.handles,
        useSpatialIndex: false, // default: true
        wrapX: !!options.wrapX
      })
    })

    this.behavior = pointerUp(this.handles)
  }

  /**
   * Handles the {@link module:ol/event map browser event}.
   * @param {import("../event.js").default} event Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @api
   */
  handleEvent (event) {
    const unhandled = function () { return PROPAGATE }
    const handler = this.behavior[event.type] || unhandled
    return handler.bind(this)(event)
  }

  setMap (map) {
    this.overlay.setMap(map)
    super.setMap(map)
  }

  /**
   * become :: (Behavior, boolean) -> boolean
   * Set new current behavior.
   */
  become (behavior, result) {
    this.behavior = behavior
    return result
  }
}

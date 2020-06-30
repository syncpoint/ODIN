import * as R from 'ramda'
import { Interaction } from 'ol/interaction'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Collection from 'ol/Collection'
import * as geom from 'ol/geom'
import { distance } from 'ol/coordinate'
import Feature from 'ol/Feature'
import Event from 'ol/events/Event'
import * as G from '../style/geodesy'
import { redPointStyle, bluePointStyle } from '../style/default-style'

/**
 * Modify event types.
 */

const MODIFYSTART = 'modifystart'
const MODIFYEND = 'modifyend'

/**
 * Modify event with same interface as ol/interaction/Modify.
 */
class ModifyEvent extends Event {
  constructor (type, features, event) {
    super(type)
    this.features = features
    this.mapBrowserEvent = event
  }
}

/**
 * point :: [number, number] -> ol/geom/Point
 * EPSG:3857 point geometry from EPSG:4326 coordinate.
 */
const point = latLon => new geom.Point(G.fromLatLon(latLon))

/**
 * handle :: [ol/geom/Geometry, fn] -> ol/Feature
 */
const handle = ([geometry, pointerdrag]) =>
  new Feature({ geometry, pointerdrag })

const DONT_PROPAGATE = false // don't propagate event
const PROPAGATE = true // propagate event

/**
 * candidateHandle :: (ol/MapBrowserEvent, [ol/Feature], number) -> ol/Feature
 * Handle under pointer (within given pixel tolerance) or null.
 */
const candidateHandle = ({ map, pixel }, [...handles], pixelTolerance) => {
  handles.forEach(feature => {
    const vertexCoodinate = G.coordinates(feature)
    const vertexPixel = map.getPixelFromCoordinate(vertexCoodinate)
    feature.set('distance', distance(pixel, vertexPixel))
  })

  const sortByDistance = (a, b) => a.get('distance') - b.get('distance')
  const candidate = handles.sort(sortByDistance)[0]
  return candidate.get('distance') <= pixelTolerance ? candidate : null
}

// Behavior :: { string -> (ol/MapBrowserEvent -> boolean)}
// Named DFA states (behaviors).
// Note: Event handlers are bound to modify interaction instance (execution context).

/**
 * (behavior) pointerUp :: [ol/Feature] -> Behavior
 * Detect focused handle under pointer.
 */
const pointerUp = handles => {
  handles.forEach(feature => feature.setStyle(redPointStyle))

  return {
    pointermove (event) {
      const handle = candidateHandle(event, handles, this.pixelTolerance)
      return handle
        ? this.become(focusHandle(handles, handle), DONT_PROPAGATE)
        : PROPAGATE
    }
  }
}

/**
 * (behavior) focusHandle :: ([ol/Feature], ol/Feature) -> Behavior
 * Initiate drag sequence for focused handle on pointer down.
 */
const focusHandle = (handles, handle) => {
  handle.setStyle(bluePointStyle)

  return {
    pointermove (event) {
      // Determine new handle (if any) under pointer.
      const handle = candidateHandle(event, handles, this.pixelTolerance)
      return handle
        ? this.become(focusHandle(handles, handle), DONT_PROPAGATE)
        : this.become(pointerUp(handles), PROPAGATE) // focus lost
    },

    pointerdown () {
      // Switch to dragging.
      return this.become(dragHandle(handles, handle), DONT_PROPAGATE)
    }
  }
}

/**
 * (behavior) dragHandle :: ([ol/Feature], ol/Feature) -> Behavior
 * Delegate point drag to event handler of control handle,
 * thus updating geometry frame.
 */
const dragHandle = (handles, handle) => {

  /**
   * pointerdrag :: (Frame, ol/MapBrowserEvent) -> boolean
   * Drag handler for current handle.
   */
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
      // Delegate event and update frame and feature geometry.
      this.frame = pointerdrag(this.frame, event)
      this.feature.setGeometry(this.frame.geometry())

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


/** Extract feature collection from options source or feature collection. */
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
 * Modify interaction used for geometries other than Polygon, LineString and Point.
 * Interaction is configured for specific geometry through extended options object.
 * Note: Interaction is implemented as DFA.
 */
export class ModifyCustom extends Interaction {

  constructor (options) {
    super(options)

    this.pixelTolerance = pixelTolerance(options)
    this.features = featureCollection(options)
    this.feature = this.features.getArray()[0]

    this.featureChanged = () => {
      // NOTE: Re-creating frame is only necessary when update was triggered
      // from the 'outside', i.e. Translate interaction.
      this.frame = options.frame(this.feature, options)

      // Update handle geometries as a result of updated feature geometry.
      this.frame.points.forEach((p, i) => this.handles[i].setGeometry(point(p)))
    }

    this.feature.on('change', this.featureChanged)

    // Setup dedicated vector layer for control features (handles).
    // NOTE: Functions `frame` and `handledrag` are specific to actual geometry.
    this.frame = options.frame(this.feature, options)
    const points = this.frame.points.map(point)
    this.handles = R.zip(points, options.handledrag).map(handle)

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

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   *
   * NOTE: Also called with null paramater when interaction is
   * removed from map. It is thus suitable to trigger cleanup code.
   *
   * @param {import("../PluggableMap.js").default} map Map.
   */
  setMap (map) {
    if (!map) this.feature.un('change', this.featureChanged)
    this.overlay.setMap(map)
    super.setMap(map)
  }

  /**
   * become :: (Behavior, boolean) -> boolean
   * Set new/current behavior.
   */
  become (behavior, result) {
    this.behavior = behavior
    return result
  }
}

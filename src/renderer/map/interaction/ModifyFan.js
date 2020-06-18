import { Interaction } from 'ol/interaction'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Collection from 'ol/Collection'
import Point from 'ol/geom/Point'
import Feature from 'ol/Feature'
import { distance } from 'ol/coordinate'
import { Fill, Stroke, Circle, Style } from 'ol/style'
import { coordinates, toLatLon, fromLatLon, wrap360 } from '../style/geodesy'

const white = [255, 255, 255, 1]
const blue = [0, 153, 255, 1]
const red = [255, 0, 0, 1]
const width = 3

const pointStyle = fillColor => [
  new Style({
    image: new Circle({
      radius: width * 2,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: white, width: width / 2 })
    }),
    zIndex: Infinity
  })
]

const sourceFeatures = source => new Collection(source.getFeatures())

const createFrame = feature => {
  const create = current => {
    const { center, orientation, size, rangeO, rangeS } = current
    const normalizedOrientation = wrap360(Number.parseFloat(orientation))
    const normalizedSize = wrap360(Number.parseFloat(size))

    return {
      copy: properties => create({ ...current, ...properties }),
      C: center,
      O: center.destinationPoint(rangeO, normalizedOrientation),
      S: center.destinationPoint(rangeS, normalizedOrientation + normalizedSize),
      orientation: normalizedOrientation,
      size: normalizedSize,
      rangeO,
      rangeS
    }
  }

  const {
    fan_area_orient_angle: orientation,
    fan_area_sctr_size_angle: size,
    fan_area_mnm_range_dim: rangeO,
    fan_area_max_range_dim: rangeS
  } = feature.getProperties()

  const center = toLatLon(coordinates(feature))
  return create({ center, orientation, size, rangeO, rangeS })
}

const controlVertexes = feature => {
  let frame = createFrame(feature)

  const handle = (geometry, drag) => {
    const feature = new Feature(geometry)
    feature.set('pointerdrag', drag)
    return feature
  }

  // Update feature and handles from next frame.
  const update = nextFrame => {
    frame = nextFrame
    handles.C.setGeometry(new Point(fromLatLon(frame.C)))
    handles.O.setGeometry(new Point(fromLatLon(frame.O)))
    handles.S.setGeometry(new Point(fromLatLon(frame.S)))
    feature.setGeometry(new Point(fromLatLon(frame.C)))
    feature.set('fan_area_orient_angle', frame.orientation)
    feature.set('fan_area_sctr_size_angle', frame.size)
    feature.set('fan_area_mnm_range_dim', frame.rangeO)
    feature.set('fan_area_max_range_dim', frame.rangeS)
  }

  // Named handles (vertexes), C = Center, O = Orientation, S = Size.
  const handles = {
    C: handle(new Point(fromLatLon(frame.C)), event => {
      update(frame.copy({ center: toLatLon(event.coordinate) }))
    }),
    O: handle(new Point(fromLatLon(frame.O)), event => {
      const { originalEvent } = event
      const O = toLatLon(event.coordinate)
      const bearing = frame.C.initialBearingTo(O)
      const distance = frame.C.distanceTo(O)

      const rangeS = originalEvent.ctrlKey
        ? distance
        : frame.rangeS

      update(frame.copy({ orientation: bearing, rangeS, rangeO: distance }))
    }),
    S: handle(new Point(fromLatLon(frame.S)), event => {
      const { originalEvent } = event
      const S = toLatLon(event.coordinate)
      const bearing = frame.C.initialBearingTo(S)
      const distance = frame.C.distanceTo(S)

      const rangeO = originalEvent.ctrlKey
        ? distance
        : frame.rangeO

      update(frame.copy({ size: bearing - frame.orientation, rangeO, rangeS: distance }))
    })
  }

  return Object.values(handles)
}


const DONT_PROPAGATE = false
const PROPAGATE = true

// Available events:
//   click, singleclick, dblclick,
//   pointerdown, pointerup,
//   pointermove, pointerdrag.
//   wheel

const sortByDistance = (a, b) => a.get('distance') - b.get('distance')

const candidateVertex = (event, source, pixelTolerance) => {
  const { map, pixel } = event
  source.forEachFeature(feature => {
    const vertexCoodinate = feature.getGeometry().getCoordinates()
    const vertexPixel = map.getPixelFromCoordinate(vertexCoodinate)
    feature.set('distance', distance(pixel, vertexPixel))
  })

  const candidate = source.getFeatures().sort(sortByDistance)[0]
  return candidate.get('distance') <= pixelTolerance ? candidate : null
}


const pointerUp = source => {
  source.forEachFeature(feature => feature.setStyle(pointStyle(red)))

  return {
    pointermove (event) {
      const candidate = candidateVertex(event, source, this.pixelTolerance)
      if (!candidate) return PROPAGATE
      this.become(focusVertex(source, candidate))
      return DONT_PROPAGATE
    }
  }
}

const focusVertex = (source, vertex) => {
  vertex.setStyle(pointStyle(blue))

  return {
    pointermove (event) {
      const candidate = candidateVertex(event, source, this.pixelTolerance)
      if (!candidate) {
        this.become(pointerUp(source))
        return PROPAGATE
      }

      this.become(focusVertex(source, candidate))
      return DONT_PROPAGATE
    },

    pointerdown () {
      this.become(dragVertex(source, vertex))
      return DONT_PROPAGATE
    }
  }
}

const dragVertex = (source, vertex) => ({
  pointerup () {
    this.become(focusVertex(source, vertex))
    return DONT_PROPAGATE
  },

  pointerdrag (event) {
    vertex.get('pointerdrag')(event)
    return DONT_PROPAGATE
  }
})

export class ModifyFan extends Interaction {

  constructor (options) {
    super(options)

    /**
     * @type {number}
     * @private
     */
    this.pixelTolerance = options.pixelTolerance !== undefined
      ? options.pixelTolerance
      : 10


    // We expect exactly one feature (of correct type).

    const features = options.source ? sourceFeatures(options.source) : options.features

    if (!features) {
      throw new Error('The modify interaction requires features or a source')
    }

    if (features.getLength() !== 1) {
      throw new Error('The modify interaction requires exactly one feature')
    }

    const feature = features.getArray()[0]


    // Setup dedicated vector layer for control features.

    this.overlay = new VectorLayer({
      source: new VectorSource({
        features: controlVertexes(feature),
        useSpatialIndex: false, // default: true
        wrapX: !!options.wrapX
      }),
      // style: options.style ? options.style : getDefaultStyleFunction(),
      updateWhileAnimating: false, // default: false
      updateWhileInteracting: false // default: false
    })

    this.behavior = pointerUp(this.overlay.getSource())
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
   * @inheritDoc
   */
  setMap (map) {
    this.overlay.setMap(map)
    super.setMap(map)
  }

  become (behavior) {
    this.behavior = behavior
  }
}

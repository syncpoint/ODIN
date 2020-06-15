/* eslint-disable camelcase */
import { Pointer } from 'ol/interaction'
import Collection from 'ol/Collection'
import MapBrowserEventType from 'ol/MapBrowserEventType'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Circle, Style } from 'ol/style'
import Point from 'ol/geom/Point'
import Feature from 'ol/Feature'

import { coordinates, toLatLon, fromLatLon } from '../style/geodesy'


const sourceFeatures = source => new Collection(source.getFeatures())
const mapView = map => map.getView()
const eventView = evt => mapView(evt.map)

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


/**
 *
 */
const controlFeatures = (options, feature) => {
  const overlay = new VectorLayer({
    source: new VectorSource({
      useSpatialIndex: false,
      wrapX: !!options.wrapX
    }),
    style: pointStyle(blue),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  })

  const {
    fan_area_orient_angle: alpha,
    fan_area_sctr_size_angle: deltaAlpha,
    fan_area_mnm_range_dim: rangeA,
    fan_area_max_range_dim: rangeB
  } = feature.getProperties()

  const handle = latLon => {
    const feature = new Feature(new Point(fromLatLon(latLon)))
    feature.setStyle(pointStyle(red))
    return feature
  }

  const C = toLatLon(coordinates(feature))
  const A = C.destinationPoint(rangeA, alpha)
  const B = C.destinationPoint(rangeB, alpha + deltaAlpha)

  const handleA = handle(A)
  const handleB = handle(B)
  const handleC = handle(C)

  const source = overlay.getSource()
  source.addFeature(handleA)
  source.addFeature(handleB)
  source.addFeature(handleC)

  return {
    setMap: map => overlay.setMap(map)
  }
}

export class ModifyFan extends Pointer {

  // PUBLIC API ==>

  constructor (options) {
    super(options)

    /**
     * @type {Collection<Feature>}
     * @private
     */
    this.features_ = options.source ? sourceFeatures(options.source) : options.features

    if (!this.features_) {
      throw new Error('The modify interaction requires features or a source')
    }

    if (this.features_.getLength() !== 1) {
      throw new Error('The modify interaction requires exactly one feature')
    }

    // TODO: precondition - fan area feature

    const feature = this.features_.getArray()[0]
    this.controlFeatures_ = controlFeatures(options, feature)


    /**
     * @type {import("../pixel.js").Pixel}
     * @private
     */
    this.lastPixel_ = [0, 0]
  }

  /**
   * @inheritDoc
   */
  setMap (map) {
    this.controlFeatures_.setMap(map)
    super.setMap(map)
  }


  /**
   * Method called by the map to notify the interaction that
   * a browser event was dispatched to the map. The function may
   * return false to prevent the propagation of the event to other
   * interactions in the map's interactions chain.
   */
  handleEvent (mapBrowserEvent) {
    if (!(mapBrowserEvent).pointerEvent) return true

    if (!eventView(mapBrowserEvent).getInteracting() &&
        mapBrowserEvent.type === MapBrowserEventType.POINTERMOVE &&
        !this.handlingDownUpSequence) {
      this.handlePointerMove_(mapBrowserEvent)
    }

    // Return false to stop propagation to other interactions.
    const propagate = super.handleEvent(mapBrowserEvent)
    console.log('[ModifyFan] handleEvent', mapBrowserEvent, propagate)
    return propagate
  }

  handleDownEvent (evt) {
    console.log('[ModifyFan] handleDownEvent', evt)
  }

  handleUpEvent (evt) {
    console.log('[ModifyFan] handleUpEvent', evt)
  }

  handleDragEvent (evt) {
    console.log('[ModifyFan] handleDragEvent', evt)
  }

  // PRIVATE API ==>

  /**
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @private
   */
  handlePointerMove_ (evt) {
    console.log('[ModifyFan] handlePointerMove_', evt)
    this.lastPixel_ = evt.pixel
    this.handlePointerAtPixel_(evt.pixel, evt.map, evt.coordinate)
  }

  /**
   * @param {import("../pixel.js").Pixel} pixel Pixel
   * @param {import("../PluggableMap.js").default} map Map.
   * @param {import("../coordinate.js").Coordinate=} opt_coordinate The pixel Coordinate.
   * @private
   */
  handlePointerAtPixel_ (pixel, map, opt_coordinate) {
    const pixelCoordinate = opt_coordinate || map.getCoordinateFromPixel(pixel)
    const projection = map.getView().getProjection()

    console.log('[ModifyFan] handlePointerAtPixel_', pixelCoordinate, projection)
  }
}

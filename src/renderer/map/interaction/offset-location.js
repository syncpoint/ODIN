import { Pointer as PointerInteraction } from 'ol/interaction'
import Collection from 'ol/Collection'
import Event from 'ol/events/Event'
import * as geom from 'ol/geom'
import * as features from '../../components/feature-descriptors'

class OffsetEvent extends Event {
  constructor (type, features, mapBrowserEvent) {
    super(type)
    this.features = features
    this.mapBrowserEvent = mapBrowserEvent
  }
}

export class OffsetLocation extends PointerInteraction {

  constructor (options) {
    super(options)
    this.source_ = options.source
  }

  handleDownEvent (mapBrowserEvent) {

    // Preconditions (for adding/removing offset indicator)
    const { originalEvent } = mapBrowserEvent
    if (!originalEvent.altKey) return
    if (!this.source_) return
    if (this.source_.getFeatures().length !== 1) return
    const [feature] = this.source_.getFeatures()
    const descriptor = features.descriptor(feature)
    if (!descriptor) return
    if (!descriptor.geometry) return
    if (descriptor.geometry.type !== 'Point') return

    const collection = new Collection(this.source_.getFeatures())
    const startEvent = new OffsetEvent('offsetstart', collection, mapBrowserEvent)
    this.dispatchEvent(startEvent)

    // Add/remove offset depending on current geometry:
    const geometry = feature.getGeometry()
    if (geometry.getType() === 'Point') {
      const coordinates = [mapBrowserEvent.coordinate, geometry.getFirstCoordinate()]
      feature.setGeometry(new geom.LineString(coordinates))
    } else {
      feature.setGeometry(new geom.Point(mapBrowserEvent.coordinate))
    }

    const endEvent = new OffsetEvent('offsetend', collection, mapBrowserEvent)
    this.dispatchEvent(endEvent)
    return false
  }
}

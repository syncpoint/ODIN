// We whant OL code to be as little changed as possible; disable some syntax checks.
/* eslint-disable semi */
/* eslint-disable space-before-function-paren */
/* eslint-disable camelcase */
/* eslint-disable comma-dangle */

import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import * as olInteraction from 'ol/interaction'
import GeometryType from 'ol/geom/GeometryType'
import { always } from 'ol/events/condition'
import {
  closestOnSegment,
  distance as coordinateDistance,
  equals as coordinatesEqual,
  squaredDistance as squaredCoordinateDistance,
  squaredDistanceToSegment
} from 'ol/coordinate'
import { fromUserExtent, toUserExtent, fromUserCoordinate, toUserCoordinate } from 'ol/proj'
import { createOrUpdateFromCoordinate as createExtent, buffer as bufferExtent } from 'ol/extent'
import { getUid } from 'ol/util.js';
import { framer } from './index'

// >>> OL/ORIGINAL
// The following code is copied from ol/Modify interaction.
// DEBT: This should be considered tech-debt; issue reference
//

/**
 * The segment index assigned to a circle's circumference when
 * breaking up a circle into ModifySegmentDataType segments.
 * @type {number}
 */
const CIRCLE_CIRCUMFERENCE_INDEX = 1;

const tempExtent = [0, 0, 0, 0];
const tempSegment = [];

/**
 * Returns the distance from a point to a line segment.
 *
 * @param {import("../coordinate.js").Coordinate} pointCoordinates The coordinates of the point from
 *        which to calculate the distance.
 * @param {SegmentData} segmentData The object describing the line
 *        segment we are calculating the distance to.
 * @param {import("../proj/Projection.js").default} projection The view projection.
 * @return {number} The square of the distance between a point and a line segment.
 */
function projectedDistanceToSegmentDataSquared(pointCoordinates, segmentData, projection) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE) {
    const circleGeometry = /** @type {import("../geom/Circle.js").default} */ (geometry);

    if (segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
      const distanceToCenterSquared =
            squaredCoordinateDistance(circleGeometry.getCenter(), pointCoordinates);
      const distanceToCircumference =
            Math.sqrt(distanceToCenterSquared) - circleGeometry.getRadius();
      return distanceToCircumference * distanceToCircumference;
    }
  }

  const coordinate = fromUserCoordinate(pointCoordinates, projection);
  tempSegment[0] = fromUserCoordinate(segmentData.segment[0], projection);
  tempSegment[1] = fromUserCoordinate(segmentData.segment[1], projection);
  return squaredDistanceToSegment(coordinate, tempSegment);
}

/**
 * Returns the point closest to a given line segment.
 *
 * @param {import("../coordinate.js").Coordinate} pointCoordinates The point to which a closest point
 *        should be found.
 * @param {SegmentData} segmentData The object describing the line
 *        segment which should contain the closest point.
 * @param {import("../proj/Projection.js").default} projection The view projection.
 * @return {import("../coordinate.js").Coordinate} The point closest to the specified line segment.
 */
function closestOnSegmentData(pointCoordinates, segmentData, projection) {
  const geometry = segmentData.geometry;

  if (geometry.getType() === GeometryType.CIRCLE && segmentData.index === CIRCLE_CIRCUMFERENCE_INDEX) {
    return geometry.getClosestPoint(pointCoordinates);
  }
  const coordinate = fromUserCoordinate(pointCoordinates, projection);
  tempSegment[0] = fromUserCoordinate(segmentData.segment[0], projection);
  tempSegment[1] = fromUserCoordinate(segmentData.segment[1], projection);
  return toUserCoordinate(closestOnSegment(coordinate, tempSegment), projection);
}

// <<< OL/ORIGINAL

/**
 * Custom modify interaction, capable of handling
 * 'special geometries'. We define a special geometry as
 * a geometry, where changing one part requires updating
 * another dependent part of the geometry.
 */
export class Modify extends olInteraction.Modify {

  constructor (options) {
    super(options)

    // Callback is evaluated in handlePointerAtPixel_().
    this.showVertexCondition_ = options.showVertexCondition
      ? options.showVertexCondition
      : always

    this.boundFeatureGeometryChanged_ = this.featureGeometryChanged_.bind(this)
  }

  featureGeometryChanged_ ({ target: geometry }) {
    if (this.changingFeature_) return
    if (!this.framer_) return
    this.framer_.updateGeometry(geometry)
  }

  /**
   * @param {Feature} feature Feature.
   * @private
   * @override
   */
  addFeature_ (feature) {
    const addFeature = feature => super.addFeature_(feature)

    // TODO: file OL issue
    // Prevent vertex feature from adding to modify interaciton (through select):
    if (feature.get('privileged')) return

    // `factory` is defined for special geometry only.
    // If undefined, default behavior kicks in (aka add simple feature).
    const factory = framer(feature)
    if (!factory) return addFeature(feature)

    // Add control features instead of originating feature:
    this.framer_ = factory(feature)
    this.framer_.controlFeatures.forEach(addFeature)

    // To support external geometry updates (e.g. translate interaction).
    feature.getGeometry().on('change', this.boundFeatureGeometryChanged_)
  }

  /**
   * @param {Feature} feature Feature.
   * @private
   * @override
   */
  removeFeature_ (feature) {
    const removeFeature = feature => super.removeFeature_(feature)

    if (!this.framer_) return removeFeature(feature)
    if (this.framer_.feature !== feature) return removeFeature(feature)

    // Remove control features instead originating feature:
    feature.getGeometry().un('change', this.boundFeatureGeometryChanged_)
    this.framer_.controlFeatures.forEach(removeFeature)
    this.framer_.dispose()
    delete this.framer_
  }

  /**
   * Little hack ahead:
   * We need a hook to sync control features with
   * feature geometry after a modification.
   * In order to do so, we use 'modifyend' (a interaction level event)
   * to update control features of all framers.
   *
   * DEBT: This should probably be considered tech-debt; issue reference
   *
   * @override
   */
  dispatchEvent (event) {
    super.dispatchEvent(event)

    if (event.type !== 'modifyend') return
    if (!this.framer_) return
    this.framer_.updateFeatures()
  }

  originatingFeature_ (feature) {
    return this.framer_
      ? this.framer_.feature
      : feature
  }

  /**
   * @param {import("../coordinate.js").Coordinate} coordinates Coordinates.
   * @return {Feature} Vertex feature.
   * @private
   * @override
   */
  createOrUpdateVertexFeature_(coordinates) {
    let vertexFeature = this.vertexFeature_;
    if (!vertexFeature) {
      // Tag vertex feature as privileged to prevent re-adding.
      // See also addFeature_().
      vertexFeature = new Feature({
        geometry: new Point(coordinates),
        privileged: true
      });
      this.vertexFeature_ = vertexFeature;
      this.overlay_.getSource().addFeature(vertexFeature);
    } else {
      const geometry = vertexFeature.getGeometry();
      geometry.setCoordinates(coordinates);
    }
    return vertexFeature;
  }

  /**
   * Override original to suppress vertex if necessary.
   * See also showVertexCondition_().
   *
   * @param {import("../pixel.js").Pixel} pixel Pixel
   * @param {import("../PluggableMap.js").default} map Map.
   * @param {import("../coordinate.js").Coordinate=} opt_coordinate The pixel Coordinate.
   * @private
   */
  handlePointerAtPixel_(pixel, map, opt_coordinate) {

    // >>> OL/ORIGINAL

    const pixelCoordinate = opt_coordinate || map.getCoordinateFromPixel(pixel);
    const projection = map.getView().getProjection();
    const sortByDistance = function (a, b) {
      return (
        projectedDistanceToSegmentDataSquared(pixelCoordinate, a, projection) -
        projectedDistanceToSegmentDataSquared(pixelCoordinate, b, projection)
      );
    };

    const viewExtent = fromUserExtent(
      createExtent(pixelCoordinate, tempExtent),
      projection
    );
    const buffer = map.getView().getResolution() * this.pixelTolerance_;
    const box = toUserExtent(
      bufferExtent(viewExtent, buffer, tempExtent),
      projection
    );

    const rBush = this.rBush_;
    const nodes = rBush.getInExtent(box);
    if (nodes.length > 0) {
      nodes.sort(sortByDistance);
      const node = nodes[0];
      const closestSegment = node.segment;
      let vertex = closestOnSegmentData(pixelCoordinate, node, projection);
      const vertexPixel = map.getPixelFromCoordinate(vertex);
      let dist = coordinateDistance(pixel, vertexPixel);
      if (dist <= this.pixelTolerance_) {
        /** @type {Object<string, boolean>} */
        const vertexSegments = {};
        vertexSegments[getUid(closestSegment)] = true;

        if (
          node.geometry.getType() === GeometryType.CIRCLE &&
          node.index === CIRCLE_CIRCUMFERENCE_INDEX
        ) {
          this.snappedToVertex_ = true;
          this.createOrUpdateVertexFeature_(vertex);
        } else {
          const pixel1 = map.getPixelFromCoordinate(closestSegment[0]);
          const pixel2 = map.getPixelFromCoordinate(closestSegment[1]);
          const squaredDist1 = squaredCoordinateDistance(vertexPixel, pixel1);
          const squaredDist2 = squaredCoordinateDistance(vertexPixel, pixel2);
          dist = Math.sqrt(Math.min(squaredDist1, squaredDist2));
          this.snappedToVertex_ = dist <= this.pixelTolerance_;

          if (this.snappedToVertex_) {
            vertex =
              squaredDist1 > squaredDist2
                ? closestSegment[1]
                : closestSegment[0];
          }

          // <<< OL/ORIGINAL

          // Hide or show/update vertext feature:

          const showVertexFeature = this.showVertexCondition_({
            vertex,
            controlFeature: node.feature,
            feature: this.originatingFeature_(node.feature),
            snappedToVertex: this.snappedToVertex_,
          })

          if (showVertexFeature) {
            this.createOrUpdateVertexFeature_(vertex);
          } else if (this.vertexFeature_) {
            this.overlay_.getSource().removeFeature(this.vertexFeature_);
            this.vertexFeature_ = null;
          }

          // >>> OL/ORIGINAL

          const geometries = {};
          geometries[getUid(node.geometry)] = true;
          for (let i = 1, ii = nodes.length; i < ii; ++i) {
            const segment = nodes[i].segment;
            if (
              ((coordinatesEqual(closestSegment[0], segment[0]) &&
                coordinatesEqual(closestSegment[1], segment[1])) ||
                (coordinatesEqual(closestSegment[0], segment[1]) &&
                  coordinatesEqual(closestSegment[1], segment[0]))) &&
              !(getUid(nodes[i].geometry) in geometries)
            ) {
              geometries[getUid(nodes[i].geometry)] = true;
              vertexSegments[getUid(segment)] = true;
            } else {
              break;
            }
          }
        }

        this.vertexSegments_ = vertexSegments;
        return;
      }
    }

    if (this.vertexFeature_) {
      this.overlay_.getSource().removeFeature(this.vertexFeature_);
      this.vertexFeature_ = null;
    }

    // <<< OL/ORIGINAL
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} evt Event.
   * @override
   */
  handleDragEvent(evt) {

    // NOTE: Drag segment array has an unusual format.
    // this.dragSegments_ :: [[segment, index]]

    const segments = [...this.dragSegments_]
      .map(([segment, _]) => segment)
      .sort((a, b) => a.index - b.index)

    // No framer, no contraints to enforce.
    if (!this.framer_) return super.handleDragEvent(evt)

    const coordinate =
      this.framer_.enforceConstraints &&
      this.framer_.enforceConstraints(segments, evt.coordinate)
    if (!coordinate) return super.handleDragEvent(evt)
    else {
      evt.coordinate = coordinate
      return super.handleDragEvent(evt)
    }
  }
}

import { Feature } from 'ol'
import * as geom from 'ol/geom'
import { getBottomLeft, getTopLeft, getTopRight, getBottomRight } from 'ol/extent'
import { tacgrp } from './tacgrp'
import { centerLabel, ewLabels } from './area-labels'


/**
 *
 */
const extentCoordinates = extent => [[
  getBottomLeft(extent), getTopLeft(extent),
  getTopRight(extent), getBottomRight(extent)
]]


/**
 *
 */
const extentPolygon = geometry =>
  new geom.Polygon(extentCoordinates(geometry.getExtent()))


/**
 *
 */
const labels = feature => [
  centerLabel(props => ['AA', props.t]),
  ewLabels(props => props.n === 'ENY' ? ['ENY'] : [])
].flatMap(fn => fn(feature))


/**
 *
 */
const selectionFeatures = feature => {
  const geometry = extentPolygon(feature.getGeometry())
  return [new Feature({ geometry })]
}


/**
 *
 */
const editorFeatures = feature => {
  const geometry = feature.getGeometry()
  const pointFeature = point => new Feature({ geometry: new geom.Point(point), role: 'handle' })
  // NOTE: Outer linear ring only, skip first point which is equal to last point.
  const handles = geometry.getCoordinates()[0].slice(1).map(pointFeature)
  return selectionFeatures(feature).concat(handles)
}


/**
 * ASSEMBLY AREA: TACGRP.C2GM.GNL.ARS.ABYARA
 */
tacgrp['G-G-GAA---'] = {
  labels,
  selectionFeatures,
  editorFeatures
}

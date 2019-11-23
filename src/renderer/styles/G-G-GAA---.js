import { Feature } from 'ol'
import * as geom from 'ol/geom'
import { getBottomLeft, getTopLeft, getTopRight, getBottomRight } from 'ol/extent'
import tacgrp from './tacgrp'
import { centerLabel, ewLabels } from './area-labels'

const extentCoordinates = extent => [[
  getBottomLeft(extent), getTopLeft(extent),
  getTopRight(extent), getBottomRight(extent)
]]

const extentPolygon = geometry =>
  new geom.Polygon(extentCoordinates(geometry.getExtent()))

// ASSEMBLY AREA: TACGRP.C2GM.GNL.ARS.ABYARA

const labels = feature => [
  centerLabel(props => ['AA', props.t]),
  ewLabels(props => props.n === 'ENY' ? ['ENY'] : [])
].flatMap(fn => fn(feature))

const editor = feature => {
  const features = geometry => {
    const bbox = new Feature({ geometry: extentPolygon(geometry) })
    const coordinates = geometry.getCoordinates()[0]
    const handles = coordinates.map(point => new Feature({ geometry: new geom.Point(point) }))
    return [...handles, bbox]
  }

  return features(feature.getGeometry())
}


tacgrp['G-G-GAA---'] = {
  labels,
  editor
}

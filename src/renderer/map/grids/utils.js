import Mgrs from 'geodesy/mgrs'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import MultiLineString from 'ol/geom/MultiLineString'

const isWithin100kGrid = (xGZD, segment, first, second, min, max) => {
  try {
    const latlon1 = new Mgrs(xGZD, segment, first, second, 0, 0).toUtm().toLatLon()
    const latlon2 = new Mgrs(xGZD, segment, first, second, 100000, 0).toUtm().toLatLon()
    const latlon3 = new Mgrs(xGZD, segment, first, second, 0, 100000).toUtm().toLatLon()
    const latlon4 = new Mgrs(xGZD, segment, first, second, 100000, 100000).toUtm().toLatLon()
    return (
      ((latlon1.lat > min[1] && latlon1.lon > min[0]) || (latlon2.lat > min[1] && latlon2.lon > min[0]) || (latlon3.lat > min[1] && latlon3.lon > min[0]) || (latlon4.lat > min[1] && latlon4.lon)) &&
      ((latlon1.lat < max[1] && latlon1.lon < max[0]) || (latlon2.lat < max[1] && latlon2.lon < max[0]) || (latlon3.lat < max[1] && latlon3.lon < max[0]) || (min[0] && latlon4.lat < max[1] && latlon4.lon < max[0]))
    )
  } catch (error) {
    return false
  }
}
const isWithinDetailGrid = (xGZD, segment, first, second, x, y, steps, min, max) => {
  try {
    const latlon1 = new Mgrs(xGZD, segment, first, second, x, y).toUtm().toLatLon()
    const latlon2 = new Mgrs(xGZD, segment, first, second, x + steps, y + steps).toUtm().toLatLon()
    const latlon3 = new Mgrs(xGZD, segment, first, second, x, y + steps).toUtm().toLatLon()
    const latlon4 = new Mgrs(xGZD, segment, first, second, x + steps, y).toUtm().toLatLon()
    return (
      ((latlon1.lat > min[1] && latlon1.lon > min[0]) || (latlon2.lat > min[1] && latlon2.lon > min[0]) || (latlon3.lat > min[1] && latlon3.lon > min[0]) || (latlon4.lat > min[1] && latlon4.lon)) &&
      ((latlon1.lat < max[1] && latlon1.lon < max[0]) || (latlon2.lat < max[1] && latlon2.lon < max[0]) || (latlon3.lat < max[1] && latlon3.lon < max[0]) || (min[0] && latlon4.lat < max[1] && latlon4.lon < max[0]))
    )
  } catch (error) {
    return false
  }
}
const createLine = (startPoint, endPoint, zIndex, text) => {
  const feature = new Feature({
    geometry: new LineString([startPoint[0], startPoint[1], endPoint[0], endPoint[1]], 'XY'),
    zIndex: zIndex
  })
  return feature
}
const createMultiLine = (coordinates, zIndex, text) => {
  const feature = new Feature({
    geometry: new MultiLineString(coordinates, 'XY'),
    zIndex: zIndex
  })
  return feature
}
export { isWithinDetailGrid, isWithin100kGrid, createLine, createMultiLine }

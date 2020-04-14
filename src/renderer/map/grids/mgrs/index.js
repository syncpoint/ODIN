import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Stroke, Text, Fill } from 'ol/style'
import { toLonLat } from 'ol/proj'
import coordinateFormat from '../../../../shared/coord-format'
// import LatLon from 'geodesy/latlon-ellipsoidal-vincenty'
import { bbox, all } from 'ol/loadingstrategy'
import { getGzdGrid } from './gzdZones'
import { getSquareGrid } from './detailZones'
import { boundingExtent } from 'ol/extent'

export default (maxResolutions = [10000, 1200, 250, 20], minResolutions = [0, 250, 20, 0]) => {
  const Grids = []
  const vectorSourceGZD = new VectorSource({
    loader: (extent, resolution, projection) => getGzdGrid(projection.extent_, (features) => {
      vectorSourceGZD.clear()
      vectorSourceGZD.addFeatures(features)
    }),
    strategy: all,
    wrapX: true
  })
  Grids.push(
    new VectorLayer({
      maxResolution: maxResolutions[0],
      minResolution: minResolutions[0],
      source: vectorSourceGZD,
      style: styleFunction
    })
  )
  for (let i = 0; i < 3; i++) {
    const vectorSourceDetailSquares = new VectorSource({
      loader: async (extent, resolution, projection) => {
        getSquareGrid(extent, projection, i, (features) => {
          vectorSourceDetailSquares.clear()
          vectorSourceDetailSquares.addFeatures(features)
        })

      },
      strategy: bbox,
      wrapX: false
    })
    Grids.push(
      new VectorLayer({
        extent: boundingExtent([-Infinity, -Infinity, Infinity, Infinity]),
        maxResolution: maxResolutions[i + 1],
        minResolution: minResolutions[i + 1],
        source: vectorSourceDetailSquares,
        style: styleFunction
      })
    )
  }
  return Grids
}

const getMgrs = (coords, zIndex) => {
  const lonLat1 = toLonLat([coords[0], coords[1]])
  const lonLat2 = toLonLat([coords[2], coords[3]])
  let mgrs = coordinateFormat.format({ lng: (lonLat1[0] + lonLat2[0]) / 2, lat: (lonLat1[1] + lonLat2[1]) / 2 }).replace(' ', '')
  if (mgrs !== '') {
    switch (zIndex) {
      case 1: {
        mgrs = mgrs.substr(0, 3)
        break
      }
      case 2: {
        mgrs = mgrs.substr(3, 2)
        break
      }
    }
  }
  return mgrs
}

const styleFunction = (feature) => {
  const styles = new Style({
    stroke: new Stroke({ color: 'rgba(255,0,0,0.4)', width: 5 / feature.values_.zIndex }),
    text: new Text({
      text: feature.values_.text || getMgrs(feature.values_.geometry.flatCoordinates, feature.values_.zIndex),
      font: '20px serif',
      textBaseline: 'ideographic',
      rotateWithView: true,
      backgroundFill: new Fill({ color: 'rgba(255,255,255,0.5)', width: 1 }),
      fill: new Fill({ color: 'rgba(255,0,0,1.0)' }),
      placement: 'point',
      offsetY: 7
    })
  })
  return styles
}

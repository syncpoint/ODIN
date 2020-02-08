import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import 'ol/ol.css'
import * as ol from 'ol'
import { Tile as TileLayer, Vector as FeatureLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import { toLonLat, fromLonLat } from 'ol/proj'
import { Pool } from 'pg'
import evented from './evented'
import style from './style'

const tail = ([_, ...values]) => values
const zoom = view => view.getZoom()
const center = view => toLonLat(view.getCenter())
const viewport = view => ({ zoom: zoom(view), center: center(view) })

// const tileSource = (url, devicePixelRatio) => new OSM({
//   url: url.replace(/{ratio}/, devicePixelRatio === 2 ? '@2x' : ''),
//   tilePixelRatio: devicePixelRatio
// })

const tileSource = (url, devicePixelRatio) => new OSM({
  tilePixelRatio: devicePixelRatio
})

const tileLayer = url => {
  const layer = new TileLayer({ source: tileSource(url, window.devicePixelRatio) })

  // Update tile source when device pixel ratio changes:
  matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addListener(() => {
    layer.setSource(tileSource(url, window.devicePixelRatio))
  })

  return layer
}


/**
 * Setup map instance (aka `componentDidMount`).
 *
 * effect :: ({k: v}, [Map -> Unit]) -> () -> Undefined
 */
const effect = (props, [setMap]) => () => {
  const { id, viewportChanged } = props
  const url = 'http://localhost:32768/styles/osm-bright/{z}/{x}/{y}{ratio}.png'
  const { zoom, center } = props.viewport
  const view = new ol.View({ zoom, center: fromLonLat(center) })

  const pool = new Pool({
    database: 'scen'
  })

  const featureSource = new VectorSource({
    format: new GeoJSON(),
    loader: (extent, resolution, projection) => {
      pool.connect(function (err, client, done) {
        if (err) {
          done()
          return console.error(err)
        } else {
          const oneOIG =
            `SELECT layer
             FROM   public.contxts
             JOIN   public.oigs USING (oig_id)
             JOIN   gis.layers USING (contxt_id)
             WHERE  oig_name_txt = 'SCEN | PLNORD | OVERLAY ORDER NO. 4 (XXX) [CIAVX]'`

          pool.query(oneOIG).then(result => {
            result.rows.forEach(row => {
              const features = featureSource.getFormat().readFeatures(row.layer, { featureProjection: 'EPSG:3857' })
              featureSource.addFeatures(features)
            })
          })
        }
      })
    }
  })

  const featureLayer = new FeatureLayer({
    style,
    source: featureSource
  })

  const layers = [tileLayer(url), featureLayer]
  const map = new ol.Map({ view, layers, target: id })

  map.on('moveend', () => viewportChanged(viewport(view)))
  evented.emit('map.ready')
  setMap(map)
}


/**
 * React OpenLayers Map function component.
 */
const Map = props => {
  // Only used once:
  useEffect(effect(props, tail(useState(null))), [])
  return <div id={props.id} />
}

Map.propTypes = {
  viewport: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  viewportChanged: PropTypes.func.isRequired
}

export default Map

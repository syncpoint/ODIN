import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import 'ol/ol.css'
import * as ol from 'ol'
import { Tile as TileLayer, Vector as FeatureLayer, Heatmap } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import { toLonLat, fromLonLat } from 'ol/proj'
import { Pool } from 'pg'
import evented from './evented'
import style from './style'
import { Style } from 'ol/style'

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
          console.log('loading features...')
          const oneOIG =
            `SELECT layer
             FROM   public.contxts
             JOIN   public.oigs USING (oig_id)
             JOIN   gis.layers USING (contxt_id)
             WHERE  oig_name_txt = 'SCEN | PLNORD | OVERLAY ORDER NO. 4 (XXX) [CIAVX]'`

          pool.query(oneOIG).then(result => {
            result.rows.forEach(row => {
              const features = featureSource.getFormat().readFeatures(row.layer, { featureProjection: 'EPSG:3857' })
              const validFeatures = features.filter(feature => feature.getGeometry())
              featureSource.addFeatures(validFeatures)
            })
            console.log('loading features...done.', featureSource.getFeatures().length)
          })
        }
      })
    }
  })

  const toggleFeatures = style => predicate => featureSource.getFeatures()
    .filter(predicate)
    .forEach(feature => feature.setStyle(style))

  const showFeatures = toggleFeatures(null)
  const hideFeatures = toggleFeatures(new Style())

  const featureLayer = new FeatureLayer({
    style,
    source: featureSource
  })

  const sidc = feature => feature.getProperties().sidc

  const heatmap = (color, weight) => {
    return new Heatmap({
      source: featureSource,
      radius: 50,
      blur: 20,
      gradient: ['#fff', color],
      opacity: 0.5,
      weight
    })
  }

  const layers = [
    tileLayer(url),
    heatmap('#FF3031', f => sidc(f).match(/SHG.U/) ? 1 : 0),
    heatmap('#00A8DC', f => sidc(f).match(/SFG.U/) ? 1 : 0),
    featureLayer
  ]

  const map = new ol.Map({ view, layers, target: id })

  map.on('moveend', () => viewportChanged(viewport(view)))
  evented.on('map.show', event => {
    switch (event.what) {
      case 'all': return showFeatures(_ => true)
      case 'units': return showFeatures(f => sidc(f).match(/S.G.U/))
      case 'graphics': return showFeatures(f => f.getGeometry().getType() !== 'Point')
      case 'points': return showFeatures(f => f.getGeometry().getType() === 'Point')
    }

    featureSource.changed()
  })

  evented.on('map.hide', event => {
    switch (event.what) {
      case 'all': return hideFeatures(_ => true)
      case 'units': return hideFeatures(f => sidc(f).match(/S.G.U/))
      case 'graphics': return hideFeatures(f => f.getGeometry().getType() !== 'Point')
      case 'points': return hideFeatures(f => f.getGeometry().getType() === 'Point')
    }

    featureSource.changed()
  })

  evented.on('map.symbol-size', () => featureSource.changed())

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

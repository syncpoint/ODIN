import * as R from 'ramda'
import { promises } from 'fs'
import path from 'path'
import { remote } from 'electron'
import evented from './evented'

const LAYERS = [
  // 'examples/division/1.Brig (Kampf).json',
  // 'examples/division/2.Brig (EU).json',
  // 'examples/division/3.Brig (Luft).json'
  // 'examples/scenario-002.json'
  'examples/TACGRP.json'
]

const loadLayers = () => {
  const { app } = remote
  const filepath = filename => path.join(app.getAppPath(), filename)
  const read = filename => promises.readFile(filename, 'utf8')
  const emit = layer => evented.emit('layer.geojson', layer)
  const resolve = promise => promise.then(emit)
  LAYERS.map(R.compose(resolve, read, filepath))
}

evented.on('map.ready', loadLayers)

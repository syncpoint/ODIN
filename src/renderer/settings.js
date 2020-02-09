import level from 'level'
import EventEmitter from 'events'


export const db = level('settings', { valueEncoding: 'json' })
const evented = new EventEmitter()

const defaultViewport = {
  zoom: 13,
  center: [15.319, 48.654] // [lng, lat]
}

const get = (key, value) => db.get(key).catch(() => value)
const put = (key, value) => db.put(key, value)
const putAndEmit = (key, value, event) => {
  db.put(key, value)
  evented.emit(event.type, event)
}

const defaultSymbolSize = 0.3

const defaultShowing = {
  labels: true,
  units: true,
  graphics: true,
  points: true
}

export const map = {
  defaultViewport,
  setViewport: viewport => put('map.viewport', viewport),
  getViewport: () => get('map.viewport', defaultViewport),
  resetViewport: () => put('map.viewport', defaultViewport),

  defaultVisibility: defaultShowing,
  showAll: () => putAndEmit('map.visible.all', true, { type: 'map.show', what: 'all' }),
  hideAll: () => putAndEmit('map.visible.all', false, { type: 'map.hide', what: 'all' }),
  showLabels: () => putAndEmit('map.visible.labels', true, { type: 'map.show', what: 'labels' }),
  hideLabels: () => putAndEmit('map.visible.labels', false, { type: 'map.hide', what: 'labels' }),
  showUnits: () => putAndEmit('map.visible.units', true, { type: 'map.show', what: 'units' }),
  hideUnits: () => putAndEmit('map.visible.units', false, { type: 'map.hide', what: 'units' }),
  showGraphics: () => putAndEmit('map.visible.graphics', true, { type: 'map.show', what: 'graphics' }),
  hideGraphics: () => putAndEmit('map.visible.graphics', false, { type: 'map.hide', what: 'graphics' }),
  showPoints: () => putAndEmit('map.visible.points', true, { type: 'map.show', what: 'points' }),
  hidePoints: () => putAndEmit('map.visible.points', false, { type: 'map.hide', what: 'points' }),
  getSymbolSize: () => get('map.symbol-size', defaultSymbolSize),

  increaseSymbolSize: async () => {
    let symbolSize = await get('map.symbol-size', defaultSymbolSize)
    symbolSize += symbolSize < 0.4 ? 0.05 : 0
    putAndEmit('map.symbol-size', symbolSize, { type: 'map.symbol-size', size: symbolSize })
  },

  decreaseSymbolSize: async () => {
    let symbolSize = await get('map.symbol-size', defaultSymbolSize)
    symbolSize -= symbolSize > 0.2 ? 0.05 : 0
    putAndEmit('map.symbol-size', symbolSize, { type: 'map.symbol-size', size: symbolSize })
  }
}

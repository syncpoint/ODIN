/* eslint-disable */
import db from './db'

const partition = 'preference'
const get = (key, value) => db.get(`${partition}:${key}`).catch(() => value)
const put = (key, value) => db.put(`${partition}:${key}`, value)

const viewport = () => {
  const key = 'map.viewport'
  const defaultViewport = {
    zoom: 13,
    center: [15.319, 48.654] // [lng, lat]
  }

  return {
    get: () => get(key, defaultViewport),
    set: viewport => put(key, viewport),
    reset: () => put(key, defaultViewport)
  }
}

const features = () => {
  const key = what => `map.display.${what}`
  const defaultScale = 0.3

  const toggle = async what => {
    const flag = await get(key(what), true)
    put(key(what), !flag)
  }

  const observe = callback => what => {
    db.on('put', (k, v) => {
      if (key(what) === k.replace(`${partition}:`, '')) callback(v)
    })
  }

  const scaleUpSymbols = async () => {
    let scale = await get(key('symbol-scale'), defaultScale)
    scale += scale < 0.4 ? 0.05 : 0
    put(key('symbol-scale'), scale)
  }

  const scaleDownSymbols = async () => {
    let scale = await get(key('symbol-scale'), defaultScale)
    scale -= scale > 0.2 ? 0.05 : 0
    put(key('symbol-scale'), scale)
  }

  return {
    toggle,
    observe,
    scaleUpSymbols,
    scaleDownSymbols,
    get: what => get(key(what), true),
    symbolScale: () => get(key('symbol-scale'), defaultScale),
    defaultSymbolScale: defaultScale
  }
}


export default {
  viewport,
  features
}

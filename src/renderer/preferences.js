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

export default {
  viewport
}

import level from 'level'
export const db = level('settings', { valueEncoding: 'json' })

const defaultViewport = {
  zoom: 13,
  center: [15.319, 48.654] // [lng, lat]
}

const get = (key, value) => db.get(key).catch(() => value)
const put = (key, value) => db.put(key, value)

export const map = {
  defaultViewport,
  setViewport: viewport => put('map.viewport', viewport),
  getViewport: () => get('map.viewport', defaultViewport),
  resetViewport: () => put('map.viewport', defaultViewport)
}

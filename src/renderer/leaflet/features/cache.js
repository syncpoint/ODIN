export const noop = () => {}

export const elementCache = () => {
  const cache = {}

  const put = (id, element) => dispose => {
    cache[id] && cache[id].dispose(cache[id].element)
    cache[id] = { element, dispose }
    return element
  }

  const element = id => {
    if (!cache[id]) throw Error(`element not cached: ${id}`)
    if (cache[id].fn) cache[id] = { element: cache[id].fn(), dispose: noop }
    return cache[id].element
  }

  const dispose = () => Object.values(cache).forEach(({ element, dispose }) => dispose(element))

  return { put, element, dispose }
}

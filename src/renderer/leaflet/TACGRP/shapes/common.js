import { maskClipping, backdropClipping, noClipping } from './polygon-clipping'

export const elementCache = () => {
  const cache = {}

  const put = (id, element) => dispose => {
    cache[id] && cache[id].dispose(cache[id].element)
    cache[id] = { element, dispose }
    return element
  }

  const element = id => cache[id].element
  const dispose = () => Object.values(cache).forEach(({ element, dispose }) => dispose(element))
  return { put, element, dispose }
}

export const noop = () => {}

export const clippingStrategy = clipping => cache => {
  switch (clipping) {
    case 'mask': return maskClipping(cache)
    case 'backdrop': return backdropClipping(cache)
    default: return noClipping(cache)
  }
}

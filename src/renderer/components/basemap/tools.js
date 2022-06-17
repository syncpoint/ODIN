import { Base64 } from 'js-base64'

const MAX_ABSTRACT_LENGTH = 140

export const layerAbstract = layer => {
  if (!layer.Abstract) return ''
  return layer.Abstract.length > MAX_ABSTRACT_LENGTH
    ? `${layer.Abstract.substring(0, MAX_ABSTRACT_LENGTH)} ...`
    : layer.Abstract
}

export const firstOrDefault = (someArray, defaultValue) => {
  if (!Array.isArray(someArray)) return defaultValue
  if (someArray.length > 0) return someArray[0]
  return defaultValue
}

export const urlToBasicAuth = url => {
  const urlObject = new URL(url)
  if (urlObject.username || urlObject.password) {
    return {
      url: `${urlObject.origin}${urlObject.pathname}${urlObject.search}`,
      authorization: 'Basic ' + Base64.encode(`${urlObject.username}:${urlObject.password}`)
    }
  }
  return { url, authorization: null }
}

/**
 * Fetcher is a wrapper around the fetch API.
 * Since the fetch API does not allow username:password@ syntax in the url
 * we remove the credentials from the url an put them into the Authorization header.

 * @param {string} url
 * @param {*} options
 * @returns The response of the fetch call
 */
export const fetcher = async (url, options = {}) => {

  const mergeAuthHeaderIntoOptions = (options = {}, authorizationValue) => {
    if (!authorizationValue) return options

    if (!options.headers) {
      options.headers = {}
    }
    options.headers.Authorization = authorizationValue

    return options
  }

  const { url: fetchUrl, authorization } = urlToBasicAuth(url)
  const fetchOptions = authorization
    ? mergeAuthHeaderIntoOptions({ ...options }, authorization)
    : options

  return fetch(fetchUrl, fetchOptions)
}


/* eslint-disable */
// XMLHttpRequest.readyState.
const UNSENT           = 0 // Client has been created. open() not called yet.
const OPENED           = 1 // open() has been called.
const HEADERS_RECEIVED = 2 // send() has been called, and headers and status are available.
const LOADING          = 3 // Downloading; responseText holds partial data.
const DONE             = 4 // The operation is complete.
/* eslint-enable */

const K = value => fn => { fn(value); return value }

const search = options => term => {
  return new Promise((resolve) => K(new XMLHttpRequest())(xhr => {
    xhr.addEventListener('readystatechange', event => {
      const request = event.target
      const readyState = request.readyState
      if (readyState !== DONE) return
      // TODO: catch/handle possible parse error
      resolve(JSON.parse(request.responseText))
    })

    const params = Object.entries(options)
      .reduce((acc, [key, value]) => acc.concat([`${key}=${value}`]), ['format=json'])
      .join('&')

    const url = `https://nominatim.openstreetmap.org/search/${term}?${params}`
    const async = true
    xhr.open('GET', url, async)
    xhr.send()
  }))
}

export default search

import { remote } from 'electron'
import Mgrs from 'geodesy/mgrs'
import Utm from 'geodesy/utm'
import { K } from '../../shared/combinators'

// Try to parse term as MGRS/UTM and use resulting Lat/Long as search term.
const latLng = term => {
  try {
    return Mgrs.parse(term).toUtm().toLatLon()
  } catch (err) {
    try {
      return Utm.parse(term).toLatLon()
    } catch (err) {
      /* don't care */
    }
  }
}

/* eslint-disable */
// XMLHttpRequest.readyState.
const UNSENT           = 0 // Client has been created. open() not called yet.
const OPENED           = 1 // open() has been called.
const HEADERS_RECEIVED = 2 // send() has been called, and headers and status are available.
const LOADING          = 3 // Downloading; responseText holds partial data.
const DONE             = 4 // The operation is complete.
/* eslint-enable */


const search = options => searchTerm => {


  // Replace search term if in MGRS/UTM format:
  const ll = latLng(searchTerm)
  const term = ll ? `${ll._lat} ${ll._lon}` : searchTerm
  const map = ll ? row => K(row)(row => (row.poi = searchTerm)) : row => row

  return new Promise((resolve, reject) => K(new XMLHttpRequest())(xhr => {
    if (!searchTerm) resolve([])

    xhr.addEventListener('readystatechange', event => {
      const request = event.target

      switch (request.readyState) {
        case DONE: {
          try {
            resolve(JSON.parse(request.responseText).map(map))
          } catch (err) {
            reject(err)
          }
        }
      }
    })

    const params = Object.entries(options)
      .reduce((acc, [key, value]) => acc.concat([`${key}=${value}`]), ['format=json'])
      .join('&')

    const url = `https://nominatim.openstreetmap.org/search/${term}?${params}`
    const async = true
    xhr.open('GET', url, async)
    xhr.setRequestHeader('Accept-Language', remote.app.getLocale())
    xhr.send()
  }))
}

export default search

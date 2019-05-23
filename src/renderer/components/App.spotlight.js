import React from 'react'
import ListItemText from '@material-ui/core/ListItemText'
import search from './nominatim'

const spotlightOptions = options => {
  const { lat, lng } = options.center
  const searchOptions = {
    // limit: 7,
    addressdetails: 1,
    namedetails: 0
  }

  const sort = (a, b) => {
    const da = Math.sqrt(
      Math.pow((lat - Number.parseFloat(a.lat)), 2) +
      Math.pow((lng - Number.parseFloat(a.lon)), 2)
    )

    const db = Math.sqrt(
      Math.pow((lat - Number.parseFloat(b.lat)), 2) +
      Math.pow((lng - Number.parseFloat(b.lon)), 2)
    )

    return da - db
  }

  const mapRow = row => ({
    key: row.place_id, // mandatory
    name: row.display_name,
    type: row.type,
    box: row.boundingbox,
    lat: row.lat,
    lon: row.lon
  })

  return {
    sort,
    mapRow,
    search: search(searchOptions),
    label: 'Place or address',
    listItemText: row => <ListItemText primary={ row.name } />,
    onSelect: options.onSelect,
    onClose: options.onClose
  }
}

export default spotlightOptions

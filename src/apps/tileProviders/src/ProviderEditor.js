import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, CardHeader, Input, InputLabel, FormControl, FormHelperText, Paper } from '@material-ui/core'

const MAX_ZOOM_LEVEL = 22
const URL_HELPER_TEXT = 'use variables like {s} for server, {z} for zoom level and {x}, {y} for coordinates'

const ProviderEditor = props => {
  const { handleDone, provider } = props
  if (!provider) return null
  const [ currentProvider, setCurrentProvider ] = useState({ ...provider })
  const [ hasInvalidFields, setHasInvalidFields ] = useState(true)

  const handlePropertyUpdate = (propertyName, value) => {
    currentProvider[propertyName] = value
    setCurrentProvider(currentProvider)
    let hasValidationErrors = false
    switch (propertyName) {
      case 'url':
      case 'name': {
        if (!value) { hasValidationErrors = true }
        debugger
        break
      }
      case 'maxZoom': {
        if (value > MAX_ZOOM_LEVEL || value <= currentProvider.minZoom) { hasValidationErrors = true }
        break
      }
      case 'minZoom': {
        if (value < 0 || value >= currentProvider.maxZoom) { hasValidationErrors = true }
        break
      }
    }
    setHasInvalidFields(hasValidationErrors)
  }



  return (
    <Paper>
      <Card>
        <CardHeader>Tile Provider setting</CardHeader>
        <CardContent>
          <FormControl required={true} fullWidth={true}>
            <InputLabel htmlFor="name">Name</InputLabel>
            <Input id="name" aria-describedby="nameHelper" defaultValue={ currentProvider.name } onChange={ event => handlePropertyUpdate('name', event.target.value) }/>
            <FormHelperText id="nameHelper">The name of the tile provider (will show up in the menu bar)</FormHelperText>
          </FormControl>
          <FormControl required={true} fullWidth={true}>
            <InputLabel htmlFor="url">URL</InputLabel>
            <Input id="url" aria-describedby="urlHelper" defaultValue={ currentProvider.url } onChange={ event => handlePropertyUpdate('url', event.target.value) }/>
            <FormHelperText id="urlHelper">{URL_HELPER_TEXT}</FormHelperText>
          </FormControl>
          <FormControl required={false} fullWidth={true}>
            <InputLabel htmlFor="attribution">Attribution</InputLabel>
            <Input id="attribution" aria-describedby="attributionHelper" defaultValue={ currentProvider.attribution } onChange={ event => handlePropertyUpdate('attribution', event.target.value) }/>
            <FormHelperText id="attributionHelper">praise the map maker</FormHelperText>
          </FormControl>
          <FormControl required={false} fullWidth={false}>
            <InputLabel htmlFor="minZoom">minimal zoom level</InputLabel>
            <Input id="minZoom" type="number" aria-describedby="minZoomHelper" defaultValue={ currentProvider.minZoom } onChange={ event => handlePropertyUpdate('minZoom', event.target.value) }/>
            <FormHelperText id="minZoomHelper">minimum zoom level is 0</FormHelperText>
          </FormControl>
          <FormControl required={false} fullWidth={false}>
            <InputLabel htmlFor="maxZoom">maximal zoom level</InputLabel>
            <Input id="maxZoom" type="number" aria-describedby="maxZoomHelper" defaultValue={ currentProvider.maxZoom } onChange={ event => handlePropertyUpdate('maxZoom', event.target.value) }/>
            <FormHelperText id="maxZoomHelper">maximum zoom level is {MAX_ZOOM_LEVEL}</FormHelperText>
          </FormControl>
        </CardContent>
        <CardActions>
          <Button variant="contained" color="primary" disabled={hasInvalidFields} onClick={() => handleDone(currentProvider)}>Save</Button>
          <Button variant="contained" color="secondary" onClick={() => handleDone(null)}>Cancel</Button>
        </CardActions>
      </Card>
    </Paper>
  )
}
ProviderEditor.propTypes = {
  provider: PropTypes.object,
  handleDone: PropTypes.func
}

export default ProviderEditor

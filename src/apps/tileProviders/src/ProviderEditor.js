import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, CardHeader, Input, InputLabel, FormControl, FormHelperText, Paper } from '@material-ui/core'

const ProviderEditor = props => {
  const { handleDone, provider } = props
  if (!provider) return null
  const [ currentProvider, setCurrentProvider ] = useState({ ...provider })

  const handlePropertyUpdate = (propertyName, value) => {
    currentProvider[propertyName] = value
    setCurrentProvider(currentProvider)
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
            <FormHelperText id="urlHelper" value='URL incuding variables like {z}/{x}/{y}' />
          </FormControl>
        </CardContent>
        <CardActions>
          <Button variant="contained" color="primary" onClick={() => handleDone(currentProvider)}>Save</Button>
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

import React from 'react'
import { PropTypes } from 'prop-types'
import { Card, CardContent, Typography } from '@material-ui/core'

import WMTSLayerTable from './WMTSLayerTable'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'

const WMTSOptions = props => {
  const { merge } = props

  /* effects */
  const [capabilities, setCapabilities] = React.useState(null)
  const [selectedLayerId, setSelectedLayerId] = React.useState(props.options.layer)

  React.useEffect(() => {
    const readCapabilites = async () => {
      try {
        const response = await fetch(props.options.url)
        const caps = (new WMTSCapabilities()).read(await response.text())
        console.dir(caps)
        setCapabilities(caps)
      } catch (error) {
        console.error(error)
        setCapabilities(null)
      }
    }
    readCapabilites()
  }, [])

  /* functions */
  const handleLayerSelected = layerId => {
    setSelectedLayerId(layerId)
    merge('layer', layerId)
  }

  /* rendering */
  if (!capabilities) return null

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography gutterBottom>{capabilities.ServiceProvider.ProviderName}</Typography>
          <Typography gutterBottom variant="h5" component="h2">{capabilities.ServiceIdentification.Title}</Typography>
          <Typography gutterBottom >{capabilities.ServiceIdentification.Abstract}</Typography>
          <div>
            <Typography variant="body2" component="p">
            Found {capabilities.Contents.Layer.length} layers and {capabilities.Contents.TileMatrixSet.length} TileMatrix sets.
            </Typography>
          </div>
        </CardContent>
      </Card>
      <WMTSLayerTable
        layers={capabilities.Contents.Layer}
        selectedLayerIdentifier={selectedLayerId}
        onLayerSelected={handleLayerSelected}
      />
    </>
  )
}
WMTSOptions.propTypes = {
  options: PropTypes.object,
  merge: PropTypes.func
}

export default WMTSOptions

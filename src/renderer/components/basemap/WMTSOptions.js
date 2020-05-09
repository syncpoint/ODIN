import React from 'react'
import { PropTypes } from 'prop-types'
import { Card, CardContent, Typography } from '@material-ui/core'

import WMTSLayerTable from './WMTSLayerTable'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'

const WMTSOptions = props => {
  const { merge, onValidation } = props

  /* effects */
  const [capabilities, setCapabilities] = React.useState(null)
  const [selectedLayerId, setSelectedLayerId] = React.useState(props.options.layer)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const fetchAndSetCapabilities = async () => {
      setError(null)
      try {
        const response = await fetch(props.options.url, { signal })
        if (!response.ok) { throw new Error(response.statusText) }
        const caps = (new WMTSCapabilities()).read(await response.text())
        setCapabilities(caps)
      } catch (error) {
        setError(error.message)
      }
    }
    fetchAndSetCapabilities()

    onValidation(!!props.options.layer)
    return () => { controller.abort() }
  }, [])

  /* increases performance */
  const layers = React.useMemo(() => {
    const MAX_ABSTRACT_LENGTH = 140

    const getAbstract = layer => {
      if (!layer.Abstract) return ''
      return layer.Abstract.length > MAX_ABSTRACT_LENGTH
        ? `${layer.Abstract.substring(0, MAX_ABSTRACT_LENGTH)} ...`
        : layer.Abstract
    }

    if (!capabilities) return []
    return capabilities.Contents.Layer.map(layer => {
      return {
        Identifier: layer.Identifier,
        Title: layer.Title,
        Abstract: getAbstract(layer)
      }
    })
  }, [capabilities])

  const wgs84BoundingBox = (wmtsCapabilites, layerId) => {
    console.log(`extracting wgs84 bb for layer ${layerId}`)
    const layer = wmtsCapabilites.Contents.Layer.find(l => l.Identifier === layerId)
    console.dir(layer)
    if (!layer) return null
    return layer.WGS84BoundingBox
  }

  /* functions */
  const handleLayerSelected = layerId => {
    if (layerId) {
      setSelectedLayerId(layerId)
      merge({
        layer: layerId,
        wgs84BoundingBox: wgs84BoundingBox(capabilities, layerId)
      })
      onValidation(true)
    } else {
      onValidation(false)
    }
  }

  /* rendering */
  if (!capabilities || error) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography gutterBottom variant="body1" color="secondary">
            Error: {error}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography gutterBottom>
            {capabilities.ServiceProvider ? capabilities.ServiceProvider.ProviderName : ''}
          </Typography>
          <Typography gutterBottom variant="h5" component="h2">
            {capabilities.ServiceIdentification ? capabilities.ServiceIdentification.Title : ''}
          </Typography>
          <Typography gutterBottom >
            {capabilities.ServiceIdentification ? capabilities.ServiceIdentification.Abstract : ''}
          </Typography>
        </CardContent>
      </Card>
      <WMTSLayerTable
        layers={layers}
        selectedLayerIdentifier={selectedLayerId}
        onLayerSelected={handleLayerSelected}
      />
    </>
  )
}
WMTSOptions.propTypes = {
  options: PropTypes.object,
  merge: PropTypes.func,
  onValidation: PropTypes.func
}

export default WMTSOptions

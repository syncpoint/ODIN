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
    const controller = new AbortController()
    const signal = controller.signal

    const fetchAndSetCapabilities = async () => {
      try {
        const response = await fetch(props.options.url, { signal })
        const caps = (new WMTSCapabilities()).read(await response.text())
        console.dir(caps)
        setCapabilities(caps)
      } catch (error) {
        console.error(error)
        setCapabilities(null)
      }
    }
    fetchAndSetCapabilities()
    return () => { controller.abort() }
  }, [])

  const columns = React.useMemo(() => [
    {
      Header: 'Title',
      accessor: 'Title'
    },
    {
      Header: 'Abstract',
      accessor: 'Abstract'
    }
  ])

  const layers = React.useMemo(() => {
    if (!capabilities) return []
    return capabilities.Contents.Layer.map(layer => {
      return {
        Identifier: layer.Identifier,
        Title: layer.Title,
        Abstract: (layer.Abstract.length > 140 ? `${layer.Abstract.substring(0, 140)} ...` : layer.Abstract)
      }
    })
  }, [capabilities])


  /* functions */
  const handleLayerSelected = layerId => {
    setSelectedLayerId(layerId)
    merge('layer', layerId)
  }

  /* rendering */
  if (!capabilities) return <div>Loading data ...</div>

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
        columns={columns}
        layers={layers}
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

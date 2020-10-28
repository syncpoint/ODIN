import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import { LayersMinus, LayersPlus, ExportVariant, ContentDuplicate } from 'mdi-material-ui'
import Tooltip from '../Tooltip.js'
import inputLayers from '../../project/input-layers'
import selection from '../../selection'
import URI from '../../project/URI'
import { useTranslation } from 'react-i18next'

const withLayer = fn => {
  const selected = selection.selected(URI.isLayerId)
  if (!selected || !selected.length) return
  fn(selected[0])
}

const actions = [
  {
    icon: <LayersPlus/>,
    tooltip: 'layers.create',
    disabled: () => false,
    sticky: true, // cannot be disabled
    action: () => inputLayers.createLayer()
  },
  {
    icon: <LayersMinus/>,
    tooltip: 'layers.delete',
    disabled: layer => !layer || layer.active,
    action: () => withLayer(layerId => inputLayers.removeLayer(layerId))
  },
  {
    icon: <ContentDuplicate/>,
    tooltip: 'layers.duplicate',
    disabled: layer => !layer,
    action: () => withLayer(layerId => inputLayers.duplicateLayer(layerId))
  },
  {
    icon: <ExportVariant/>,
    tooltip: 'layers.share',
    disabled: layer => !layer,
    action: () => { withLayer(layerId => inputLayers.exportLayer(layerId)) }
  }
]

export const Actions = (/* props */) => {
  const { t } = useTranslation()
  const [layer, setLayer] = React.useState(null)

  React.useEffect(() => {
    const handleEvent = () => {
      const selected = selection.selected(URI.isLayerId)
      if (selected.length === 0) setLayer(null)
      else setLayer(inputLayers.layerProperties(selected[0]))
    }

    /*
      We need to take care if the active layer has changed
      since the active layer must not be removed. This additional
      handler is required because the selection does not change
      on the double-click. Thus the properties are not beeing refreshed
      by only handling the selection events.
    */
    const layerActivatedHandler = event => {
      if (event.type !== 'layeractivated') return
      handleEvent()
    }

    selection.on('selected', handleEvent)
    selection.on('deselected', handleEvent)
    inputLayers.register(layerActivatedHandler)

    return () => {
      selection.off('selected', handleEvent)
      selection.off('deselected', handleEvent)
      inputLayers.deregister(layerActivatedHandler)
    }
  }, [])

  return actions.map(({ icon, tooltip, disabled, action }, index) => (
    <Tooltip key={index} title={t(tooltip)}>
      {/* </span> needed for disabled </Tooltip> child. */}
      <span>
        <IconButton size='small' disabled={disabled(layer)} onClick={action}>
          { icon }
        </IconButton>
      </span>
    </Tooltip>
  ))
}

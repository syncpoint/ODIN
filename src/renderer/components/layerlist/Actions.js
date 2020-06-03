import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import { LayersMinus, LayersPlus, ExportVariant, ContentDuplicate } from 'mdi-material-ui'
import Tooltip from '../Tooltip.js'
import inputLayers from '../../project/input-layers'
import selection from '../../selection'
import URI from '../../project/URI'
import { noop } from '../../../shared/combinators'
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
    disabled: () => true,
    action: noop
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

    selection.on('selected', handleEvent)
    selection.on('deselected', handleEvent)

    return () => {
      selection.off('selected', handleEvent)
      selection.off('deselected', handleEvent)
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

import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import { LayersMinus, LayersPlus, ExportVariant, ContentDuplicate } from 'mdi-material-ui'
import Tooltip from '../Tooltip.js'
import inputLayers from '../../project/input-layers'
import selection from '../../selection'
import URI from '../../project/URI'

const actions = [
  {
    icon: <LayersPlus/>,
    tooltip: 'Add Layer',
    disabled: false,
    action: () => inputLayers.createLayer()
  },
  {
    icon: <LayersMinus/>,
    tooltip: 'Delete Layer',
    disabled: false,
    action: () => {
      const selected = selection.selected(URI.isLayerId)
      if (!selected || !selected.length) return
      inputLayers.removeLayer(selected[0])
    }
  },
  {
    icon: <ContentDuplicate/>,
    tooltip: 'Duplicate Layer',
    disabled: true
  },
  {
    icon: <ExportVariant/>,
    tooltip: 'Share layer',
    disabled: true
  }
]

export const Actions = (/* props */) => {

  return actions.map(({ icon, tooltip, disabled, action }, index) => (
    <Tooltip key={index} title={tooltip}>
      {/* </span> needed for disabled </Tooltip> child. */}
      <span>
        <IconButton size='small' disabled={disabled} onClick={action}>
          { icon }
        </IconButton>
      </span>
    </Tooltip>
  ))
}

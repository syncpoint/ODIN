import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import { LayersMinus, LayersPlus, ExportVariant, ContentDuplicate } from 'mdi-material-ui'
import Tooltip from '../Tooltip.js'

export const Actions = (/* props */) => {
  const actions = [
    { icon: <LayersPlus/>, tooltip: 'Add Layer', disabled: true },
    { icon: <LayersMinus/>, tooltip: 'Delete Layer', disabled: true },
    { icon: <ContentDuplicate/>, tooltip: 'Duplicate Layer', disabled: true },
    { icon: <ExportVariant/>, tooltip: 'Share layer', disabled: true }
  ]

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

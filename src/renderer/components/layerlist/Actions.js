import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import { LayersMinus, LayersPlus, ExportVariant, ContentDuplicate } from 'mdi-material-ui'
import Tooltip from '../Tooltip.js'
import inputLayers from '../../project/input-layers'
import selection from '../../selection'
import URI from '../../project/URI'
import { K, noop } from '../../../shared/combinators'
import { useTranslation } from 'react-i18next'

const withLayer = fn => {
  const selected = selection.selected(URI.isLayerId)
  if (!selected || !selected.length) return
  fn(selected[0])
}

const actionDescriptors = [
  {
    icon: <LayersPlus/>,
    tooltip: 'layers.create',
    disabled: false,
    sticky: true, // cannot be disabled
    action: () => inputLayers.createLayer()
  },
  {
    icon: <LayersMinus/>,
    tooltip: 'layers.delete',
    disabled: true,
    action: () => withLayer(layerId => inputLayers.removeLayer(layerId))
  },
  {
    icon: <ContentDuplicate/>,
    tooltip: 'layers.duplicate',
    disabled: true,
    action: () => withLayer(layerId => inputLayers.duplicateLayer(layerId))
  },
  {
    icon: <ExportVariant/>,
    tooltip: 'layers.share',
    disabled: true,
    action: noop
  }
]

const reducer = (prev) => K([...prev])(next => {
  const selected = selection.selected(URI.isLayerId)
  next
    .filter(action => action.action !== noop)
    .filter(action => !action.sticky)
    .forEach(action => (action.disabled = !selected.length))
})

export const Actions = (/* props */) => {
  const { t } = useTranslation()
  const [actions, dispatch] = React.useReducer(reducer, actionDescriptors)

  React.useEffect(() => {
    const handleEvent = () => dispatch()
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
        <IconButton size='small' disabled={disabled} onClick={action}>
          { icon }
        </IconButton>
      </span>
    </Tooltip>
  ))
}

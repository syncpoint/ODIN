import React from 'react'
import selection from '../../selection'
import URI from '../../project/URI'
import UnitProperties from './UnitProperties'

const panelContent = ids => {
  if (ids.length !== 1) return null
  return <UnitProperties/>
}

const PropertyPanel = () => {

  const [content, setContent] = React.useState(null)

  React.useEffect(() => {
    const updateSelection = () => {
      setContent(panelContent(selection.selected(URI.isFeatureId)))
    }

    selection.on('selected', updateSelection)
    selection.on('deselected', updateSelection)

    return () => {
      selection.off('selected', updateSelection)
      selection.off('deselected', updateSelection)
    }
  })

  return content
}

export default PropertyPanel

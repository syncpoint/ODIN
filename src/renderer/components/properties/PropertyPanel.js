import React from 'react'
import providers from '../../properties-providers'
import './feature-properties'

const PropertyPanel = () => {
  const [content, setContent] = React.useState(null)

  React.useEffect(() => {
    const selectionUpdated = (content = null) => setContent(content)
    providers.on('selected', selectionUpdated)

    return () => {
      providers.off('selected', selectionUpdated)
    }
  }, [])

  return content
}

export default PropertyPanel

import React from 'react'

import providers from '../../properties-providers'
import './feature-properties'

const PropertyPanel = () => {

  const [content, setContent] = React.useState(null)

  React.useEffect(() => {
    const selectionUpdated = (content = null) => setContent(content)
    providers.on('selected', selectionUpdated)
    console.log('mounted PropertyPanel')

    return () => {
      providers.off('selected', selectionUpdated)
      console.log('un-mounted PropertyPanel')
    }
  }, [])

  return <>{content}</>
}

export default PropertyPanel

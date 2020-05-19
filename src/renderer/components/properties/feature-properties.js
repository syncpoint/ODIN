import React from 'react'
import providers from '../../properties-providers'
import URI from '../../project/URI'
import inputLayers from '../../project/input-layers'

import UnitProperties from './UnitProperties'

providers.register(selected => {
  const featureIds = selected.filter(URI.isFeatureId)

  if (featureIds.length !== 1) return null

  const properties = inputLayers.featureProperties(featureIds[0])
  const updateFeature = properties => {
    inputLayers.updateFeatureProperties(featureIds[0], properties)
  }

  return <UnitProperties feature={properties} updateFeature={updateFeature}/>
})

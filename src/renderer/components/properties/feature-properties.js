import React from 'react'
import providers from '../../properties-providers'
import URI from '../../project/URI'
import inputLayers from '../../project/input-layers'
import descriptors from '../feature-descriptors'
import UnitProperties from './UnitProperties'
import AreaProperties from './AreaProperties'
import LineProperties from './LineProperties'

const panelTypes = {
  U: (key, props) => <UnitProperties key={key} { ...props }/>,
  A: (key, props) => <AreaProperties key={key} { ...props }/>,
  L: (key, props) => <LineProperties key={key} { ...props }/>
}

providers.register(selected => {
  const featureIds = selected.filter(URI.isFeatureId)

  if (featureIds.length !== 1) return null

  const properties = inputLayers.featureProperties(featureIds[0])
  const updateFeature = properties => inputLayers.updateFeatureProperties(featureIds[0], properties)
  const clazz = descriptors.featureClass(properties.sidc)
  if (!clazz) {
    console.log('feature class missing', properties.sidc)
    // TODO: return generic 2525C properties panel
    return null
  }

  const key = featureIds[0]
  const props = { feature: properties, updateFeature }
  return (panelTypes[clazz] || (() => null))(key, props)
})

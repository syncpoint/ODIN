import React from 'react'
import providers from '../../properties-providers'
import URI from '../../project/URI'
import inputLayers from '../../project/input-layers'
import * as descriptors from '../feature-descriptors'
import UnitProperties from './UnitProperties'
import AreaProperties from './AreaProperties'
import LineProperties from './LineProperties'
import EquipmentProperties from './EquipmentProperties'
import StabilityOperationsProperties from './StabilityOperationsProperties'
import PointProperties from './PointProperties'
import InstallationProperties from './InstallationProperties'
import EEIProperties from './EEIProperties'

const panelTypes = {
  U: (key, props) => <UnitProperties key={key} { ...props }/>,
  A: (key, props) => <AreaProperties key={key} { ...props }/>,
  L: (key, props) => <LineProperties key={key} { ...props }/>,
  E: (key, props) => <EquipmentProperties key={key} { ...props }/>,
  SO: (key, props) => <StabilityOperationsProperties key={key} { ...props }/>,
  P: (key, props) => <PointProperties key={key} { ...props }/>,
  I: (key, props) => <InstallationProperties key={key} { ...props }/>,
  EEI: (key, props) => <EEIProperties key={key} { ...props }/>
}

providers.register(selected => {
  const featureIds = selected.filter(URI.isFeatureId)

  if (featureIds.length !== 1) return null

  const properties = inputLayers.featureProperties(featureIds[0])
  const update = properties => inputLayers.updateFeatureProperties(featureIds[0], properties)

  const featureClass = properties => {
    const clazz = descriptors.featureClass(properties.sidc)
    // Installation trumps original class:
    if (properties.sidc[10] === 'H') return 'I'
    return clazz
  }

  // Fall back to area when undefined.
  const clazz = featureClass(properties) || 'A'
  const key = featureIds[0]
  const props = { properties, update }
  return panelTypes[clazz](key, props)
})

import React from 'react'
import create from 'zustand/vanilla'
import providers from '../../properties-providers'
import URI from '../../project/URI'
import inputLayers from '../../project/input-layers'
import * as descriptors from '../feature-descriptors'
import UnitProperties from './UnitProperties'
import AreaProperties from './AreaProperties'
import LineProperties from './LineProperties'
import EquipmentProperties from './EquipmentProperties'
import SigIntEquipmentProperties from './SigIntEquipmentProperties'
import StabilityOperationsProperties from './StabilityOperationsProperties'
import PointProperties from './PointProperties'
import GenericPointProperties from './GenericPointProperties'
import InstallationProperties from './InstallationProperties'
import EEIProperties from './EEIProperties'
import BoundariesProperties from './BoundariesProperties'

import PropertyPanelContent from './PropertyPanelContent'

const panelTypes = {
  U: (key, props) => <UnitProperties key={key} { ...props }/>,
  A: (key, props) => <AreaProperties key={key} { ...props }/>,
  L: (key, props) => <LineProperties key={key} { ...props }/>,
  E: (key, props) => <EquipmentProperties key={key} { ...props }/>,
  SI: (key, props) => <SigIntEquipmentProperties key={key} { ...props }/>,
  SO: (key, props) => <StabilityOperationsProperties key={key} { ...props }/>,
  P: (key, props) => <PointProperties key={key} { ...props }/>,
  I: (key, props) => <InstallationProperties key={key} { ...props }/>,
  EI: (key, props) => <InstallationProperties key={key} { ...props }/>,
  EEI: (key, props) => <EEIProperties key={key} { ...props }/>,
  GP: (key, props) => <GenericPointProperties key={key} { ...props }/>,
  BL: (key, props) => <BoundariesProperties key={key} { ...props }/>
}

/* create an empty store for properties */
const store = create(() => ({}))

providers.register(selected => {

  const featureIds = selected.filter(URI.isFeatureId)
  if (featureIds.length !== 1) {
    store.destroy() // remove all listeners FIRST!
    store.setState({}, true) // THEN overwrite current state with empty object
    return null /* no multiselect */
  }

  // For now we need to have a SIDC to infer properties panel.
  // In the future we have to be more flexible.
  const featureProperties = inputLayers.featureProperties(featureIds[0])
  if (!featureProperties.references) featureProperties.references = []
  if (!featureProperties.sidc) return null

  store.destroy() // remove all listeners
  store.setState(featureProperties, true) // overwrite current state
  store.subscribe(currentFeatureProperties => inputLayers.updateFeatureProperties(featureIds[0], currentFeatureProperties))

  const featureClass = properties => {
    const clazz = descriptors.featureClass(properties.sidc)
    // Installation trumps original class:
    if (properties.sidc[10] === 'H') return 'I'
    return clazz
  }

  // Fall back to area when undefined.
  let clazz = featureClass(featureProperties)
  if (!clazz) {
    const geometry = descriptors.featureGeometry(featureProperties.sidc)
    clazz = (geometry.type === 'Point') ? 'GP' : 'A'
  }

  const key = featureIds[0]
  const props = { properties: store.getState(), update: store.setState }
  const panel = (panelTypes[clazz] || (() => null))

  return (
    <PropertyPanelContent {...props}>
      { panel(key, props) }
    </PropertyPanelContent>
  )
})

import React from 'react'
import * as R from 'ramda'
import { editors } from './editors'
import layerStore from '../../stores/layer-store'
import UnitProperties from './UnitProperties'
import AreaProperties from './AreaProperties'
import EquipmentProperties from './EquipmentProperties'
import BoundaryLineProperties from './BoundaryLineProperties'

const featureClasses = {
  U: {
    description: 'Units',
    patterns: [/^S.G.U.*$/],
    pane: (layerId, featureId, feature) => <UnitProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  E: {
    description: 'Equipment',
    patterns: [/^S.G.E.*$/],
    pane: (layerId, featureId, feature) => <EquipmentProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  I: { description: 'Installations', patterns: [/^S.G.I.*$/] }, // S.G.......H.*
  SI: { description: 'Signals Intelligence', patterns: [/^I.*$/] },
  SO: { description: 'Stability Operations', patterns: [/^O.*$/] },
  EU: { description: 'EMS Units' },
  EEI: { description: 'EMS Equipment and Incidents', patterns: [/^E.I.*$/] },
  EI: { description: 'EMS Installations', patterns: [/^E.O.......H.*$/, /^E.F.......H.*$/] },
  P: { description: 'Points', patterns: [/^G.G.GP.*$/, /G.G.AP.*/] },
  L: { description: 'Lines' },

  A: {
    description: 'Areas',
    // TODO: check if one pattern is enough: /^G.G..A.*$/
    patterns: [/^G.G.SA.*$/, /G*G*GA.*/, /G*G*OA.*/],
    pane: (layerId, featureId, feature) => <AreaProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  N: { description: 'Nuclear' },

  BL: {
    description: 'Boundary Lines',
    patterns: [/^G.G.GLB---....X$/],
    pane: (layerId, featureId, feature) => <BoundaryLineProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },
  'B/C': { description: 'Bio/Chemical' }
}

const handler = {
  propertiesPane: urn => {
    const [layerId, featureId] = urn.split(':').slice(2)
    const feature = R.clone(layerStore.feature(layerId, featureId))
    const sidc = feature.properties.sidc

    const clazz = Object.entries(featureClasses)
      .filter(([_, { patterns }]) => patterns)
      .find(([_, { patterns }]) => patterns.some(pattern => sidc.match(pattern)))

    if (clazz && clazz[1].pane) return () => clazz[1].pane(layerId, featureId, feature)
    else return () => {} /* undefined */
  }
}

editors.register('feature', handler)

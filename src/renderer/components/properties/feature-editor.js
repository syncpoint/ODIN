import React from 'react'
import * as R from 'ramda'
import { editors } from './editors'
import layerStore from '../../stores/layer-store'
import UnitProperties from './UnitProperties'
import AreaProperties from './AreaProperties'
import EquipmentProperties from './EquipmentProperties'
import BoundaryLineProperties from './BoundaryLineProperties'
import PointProperties from './PointProperties'
import StabilityOperationsProperties from './StabilityOperationsProperties'
import EEIProperties from './EEIProperties'

const featureClasses = {
  U: {
    description: 'Units',
    patterns: [
      /^S.G.U.*$/,
      /^S.F.*$/ // SPECIAL OPERATIONS FORCES (SOF) UNIT
    ],
    pane: (layerId, featureId, feature) => <UnitProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  E: {
    description: 'Equipment',
    patterns: [
      /^S.G.E.*$/,
      /^S.[S|U|A|P].*$/ // SEA SURFACE, SUBSURFACE, AIR AND TRACK
    ],
    pane: (layerId, featureId, feature) => <EquipmentProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  I: { description: 'Installations', patterns: [/^S.G.I.*$/] }, // S.G.......H.*
  SI: { description: 'Signals Intelligence', patterns: [/^I.*$/] },

  SO: {
    description: 'Stability Operations',
    patterns: [/^O.*$/],
    pane: (layerId, featureId, feature) => <StabilityOperationsProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  EU: { description: 'EMS Units' },
  EEI: {
    description: 'EMS Equipment and Incidents',
    patterns: [/^E.I.*$/],
    pane: (layerId, featureId, feature) => <EEIProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },
  EI: { description: 'EMS Installations', patterns: [/^E.O.......H.*$/, /^E.F.......H.*$/] },

  P: {
    description: 'Points',
    // TODO: check if one pattern is enough: /^G.G..P.*$/
    patterns: [
      /^G.G.GP.*$/,
      /^G.G.AP.*$/,
      /^G.S.P.*$/, // combat service support
      /^G.G.DP.*$/, // defense points
      /^G.M.BCP.*$/ // ENGINEER REGULATING POINT
    ],
    pane: (layerId, featureId, feature) => <PointProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  L: { description: 'Lines' },

  A: {
    description: 'Areas',
    // TODO: check if one pattern is enough: /^G.G..A.*$/
    patterns: [
      /^G.G.SA.*$/,
      /G.G.GA.*/,
      /G.G.OA.*/,
      /G.G.DA.*/, // defense areas
      /G.G.AA.*/, // aviation areas
      /G.M.OU----.*/,
      /G.S.A.*/,
      /G.F.A.*/
    ],
    pane: (layerId, featureId, feature) => <AreaProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  N: { description: 'Nuclear' },

  BL: {
    description: 'Boundary Lines',
    patterns: [/^G.G.GLB---.*$/],
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
  }
}

editors.register('feature', handler)

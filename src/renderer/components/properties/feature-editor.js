import React from 'react'
import * as R from 'ramda'
import { editors } from './editors'
import layerStore from '../../stores/layer-store'
import UnitProperties from './UnitProperties'
import AreaProperties from './AreaProperties'
import LineProperties from './LineProperties'
import EquipmentProperties from './EquipmentProperties'
import BoundaryLineProperties from './BoundaryLineProperties'
import PointProperties from './PointProperties'
import StabilityOperationsProperties from './StabilityOperationsProperties'
import EEIProperties from './EEIProperties'
import InstallationProperties from './InstallationProperties'

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

  I: {
    description: 'Installations',
    patterns: [/^S.G.I.*$/],
    pane: (layerId, featureId, feature) => <InstallationProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

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

  EI: {
    description: 'EMS Installations',
    patterns: [/^E.O.......H.*$/, /^E.F.......H.*$/],
    pane: (layerId, featureId, feature) => <InstallationProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  P: {
    description: 'Points',
    // TODO: check if one pattern is enough: /^G.G..P.*$/
    patterns: [
      /^G.F.PC.*$/, // COMMAND & CONTROL POINTS
      /^G.G.AP.*$/,
      /^G.G.GP.*$/,
      /^G.G.OPP.*$/, // POINT OF DEPARTURE
      /^G.G.DP.*$/, // defense points
      /^G.M.BCP.*$/, // ENGINEER REGULATING POINT
      /^G.M.ND.*$/, // DECONTAMINATION (DECON) POINTS
      /^G.S.P.*$/ // combat service support
    ],
    pane: (layerId, featureId, feature) => <PointProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

  L: {
    description: 'Lines',
    patterns: [
      /^G.T.*$/, // tasks
      /^G.G.GL[^B].*$/, // general lines (excluding boundaries line)
      /^G.G.DL.*$/, // defense lines
      /^G.G.OL.*$/, // offense lines
      /^G.G.SL.*$/, // special lines
      /^G.F.L.*$/ // fire support lines
    ],
    pane: (layerId, featureId, feature) => <LineProperties layerId={ layerId } featureId={ featureId } feature={ feature } />
  },

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

    // No, SIDC, no properties editor:
    if (!sidc) return

    const clazz = Object.entries(featureClasses)
      .filter(([_, { patterns }]) => patterns)
      .find(([_, { patterns }]) => patterns.some(pattern => sidc.match(pattern)))

    if (clazz && clazz[1].pane) return () => clazz[1].pane(layerId, featureId, feature)
  }
}

editors.register('feature', handler)

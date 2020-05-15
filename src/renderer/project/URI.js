import uuid from 'uuid-random'

const SCHEME_FEATURE = 'feature:'
const SCHEME_LAYER = 'layer:'

export default {
  SCHEME_FEATURE,
  SCHEME_LAYER,
  layerId: featureId => featureId
    ? `layer:${featureId.match(/feature:(.*)\/.*/)[1]}`
    : `layer:${uuid()}`,

  featureId: layerId => `feature:${layerId.match(/layer:(.*)/)[1]}/${uuid()}`,
  isFeatureId: s => s.startsWith('feature:'),
  isLayerId: s => s.startsWith('layer:')
}

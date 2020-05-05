import uuid from 'uuid-random'

export default {
  layerId: featureId => featureId
    ? `layer:${featureId.match(/feature:(.*)\/.*/)[1]}`
    : `layer:${uuid()}`,

  featureId: layerId => `feature:${layerId.match(/layer:(.*)/)[1]}/${uuid()}`,
  isFeatureId: s => s.startsWith('feature:')
}

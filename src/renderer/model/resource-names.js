export const ResourceNames = {
  nid: urn => urn.split(':')[1],
  layerId: layerId => `urn:layer:${layerId}`,
  featureId: (layerId, featureId) => `urn:feature:${layerId}:${featureId}`
}

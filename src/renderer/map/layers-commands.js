import { geometryType, syncFeatures } from './layers-util'

export const updateFeatureGeometry = (context, initial, current) => {
  const { sources, selectionSource } = context

  return {
    inverse: () => updateFeatureGeometry(context, current, initial),
    apply: () => {
      const features = Object.entries(initial).reduce((acc, [id, geometry]) => {
        const source = sources[geometryType(geometry)]
        const feature = selectionSource.getFeatureById(id) || source.getFeatureById(id)
        feature.setGeometry(geometry)
        return acc.concat(feature)
      }, [])

      // Write features/layers back to disk:
      syncFeatures(features)
    }
  }
}

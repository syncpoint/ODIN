export default {
  layerId: feature => feature.get('layerId'),
  id: feature => feature.getId(),
  hasLayerId: layerId => feature => feature.get('layerId') === layerId,
  cloneGeometry: feature => feature.getGeometry().clone(),

  locked: feature => feature.get('locked'),
  unlocked: feature => !feature.get('locked'),
  hidden: feature => feature.get('hidden'),
  showing: feature => !feature.get('hidden'),
  hide: feature => feature.set('hidden', true),
  unhide: feature => feature.unset('hidden'),
  lock: feature => feature.set('locked', true),
  unlock: feature => feature.unset('locked'),
  hiddenOrLocked: feature => feature.get('hidden') || feature.get('locked')
}

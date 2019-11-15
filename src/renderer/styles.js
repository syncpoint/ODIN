import symbolStyle from './styles/symbol-style'
import tacgrpStyle from './styles/tacgrp-style'

const featureStyle = modeOptions => (feature, resolution) => {
  if (!feature.getGeometry()) return null
  const fn = feature.getGeometry().getType() === 'Point' ? symbolStyle : tacgrpStyle
  return fn(modeOptions)(feature, resolution)
}

export const defaultStyle = featureStyle({ mode: 'default' })
export const highlightStyle = featureStyle({ mode: 'highlighted' })

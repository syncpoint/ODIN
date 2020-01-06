import symbolStyle from './styles/symbol-style'
import graphicsStyle from './styles/tacgrp-style'

const featureStyle = modeOptions => (feature, resolution) => {
  if (!feature.getGeometry()) return null
  const fn = feature.getGeometry().getType() === 'Point' ? symbolStyle : graphicsStyle
  const style = fn(modeOptions)(feature, resolution)
  return style
}

export const defaultStyle = featureStyle({ mode: 'default' })
export const highlightStyle = featureStyle({ mode: 'highlighted' })

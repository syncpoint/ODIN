import symbolStyle from './styles/symbol-style'
import tacgrpStyle from './styles/tacgrp-style'
import { Style, Stroke } from './styles/predef'

const featureStyle = modeOptions => (feature, resolution) => {
  if (!feature.getGeometry()) return null

  const { sidc } = feature.getProperties()
  if (!sidc) {
    if (!feature.getStyle()) {
      const style = [ Style.of({
        // TODO: tolerance should depend on resolution.
        geometry: feature.getGeometry().simplify(100), // tolerance [meters]
        stroke: Stroke.of({ color: 'black' })
      })]
      feature.setStyle(style)
      return style
    }
  }

  const fn = feature.getGeometry().getType() === 'Point' ? symbolStyle : tacgrpStyle
  return fn(modeOptions)(feature, resolution)
}

export const defaultStyle = featureStyle({ mode: 'default' })
export const highlightStyle = featureStyle({ mode: 'highlighted' })

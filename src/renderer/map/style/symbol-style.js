import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import * as geom from 'ol/geom'
import ms from 'milsymbol'
import { K } from '../../../shared/combinators'
import { defaultStyle, styleFactory, styleOptions } from './default-style'

const MODIFIERS = {
  c: 'quantity',
  f: 'reinforcedReduced',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',
  v: 'type',
  z: 'speed',
  aa: 'specialHeadquarters',
  w: 'dtg'
}

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .filter(([key, value]) => {
    if (key === 't' && value === '[NO FORMALABBREVIATEDNAME]') return false
    if (key === 't' && value === 'Untitled') return false
    if (key === 'v' && value === 'Not otherwise specified') return false
    if (key === 'v' && value === 'Not Specified') return false
    return true
  })
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIERS[key]] = value)), {})


const icon = symbol => {
  const anchor = [symbol.getAnchor().x, symbol.getAnchor().y]
  const imgSize = size => [Math.floor(size.width), Math.floor(size.height)]
  return new Icon({
    anchor,
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    imgSize: imgSize(symbol.getSize()),
    img: symbol.asCanvas()
  })
}

// Point geometry, aka symbol.
export const symbolStyle = mode => (feature, resolution) => {
  const factory = styleFactory({ mode, feature, resolution })(R.identity)
  const { sidc, ...properties } = feature.getProperties()
  const infoFields = mode === 'selected' ||
    mode === 'multi' ||
    factory.showLabels()

  const outlineWidth = mode === 'selected' ? 6 : 4
  const options = {
    ...modifiers(properties),
    outlineWidth,
    outlineColor: 'white',
    infoFields
  }

  const style = styleOptions({ feature })

  let actualSIDC = sidc
  if (sidc && sidc[0] === 'G') {
    // MilSymbols cannot handle undefined hostility
    // state ('-') for TACGRP symbols => Use Friend, but don't
    // use hostility color.
    if (sidc[1] === '-') {
      const chars = [...sidc]
      chars[1] = 'F'
      actualSIDC = chars.join('')
    } else {
      // Set mono color according to hostility state.
      const color = style.primaryColor
      options.monoColor = color
      options.outlineColor = style.accentColor
    }
  }

  options.colorMode = style.scheme
  options.size = style.symbolScale

  const symbol = new ms.Symbol(actualSIDC, options)
  const geometry = feature.getGeometry()
  const pointStyle = () => [new Style({ image: icon(symbol) })]

  const lineStringStyle = () => {
    const point = new geom.Point(geometry.getFirstCoordinate())
    return [
      new Style({
        image: icon(symbol),
        geometry: point
      }),
      factory.solidLine(geometry, { color: 'black', accent: 'white' })
    ]
  }

  if (symbol.isValid()) {
    const marker = geometry.getType() === 'Point'
      ? pointStyle()
      : lineStringStyle()

    return [
      ...marker,
      ...(mode === 'multi' ? factory.handles(feature.getGeometry()) : [])
    ].flat()

  } else return defaultStyle(feature)
}

import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import * as geom from 'ol/geom'
import ms from '../../components/milsymbol/msExtend'
import { K } from '../../../shared/combinators'
import { featureClass } from '../../components/feature-descriptors'
import { echelonPart } from '../../components/SIDC'
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

const symbolSizeBySIDC = (sidc, defaultSize) => {
  const clazz = featureClass(sidc)
  if (clazz !== 'U') return defaultSize // units only :-)

  const echelon = echelonPart.value(sidc)
  if (!echelon || echelon === '-') return defaultSize
  if (echelon >= 'H') return Math.floor(1.55 * defaultSize) // Brigade or bigger
  if (echelon >= 'F') return Math.floor(1.34 * defaultSize) // Bataillon or Regiment
  if (echelon === 'E') return Math.floor(1.21 * defaultSize) // Company
  if (echelon === 'D') return Math.floor(1.13 * defaultSize) // Platoon
  if (echelon === 'C') return Math.floor(1.08 * defaultSize) // Section
  return defaultSize
}

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
  options.size = style.symbolSizeByEchelon ? symbolSizeBySIDC(actualSIDC, style.symbolSize) : style.symbolSize
  options.simpleStatusModifier = style.simpleStatusModifier
  options.infoSize = style.symbolTextSize

  if (actualSIDC.startsWith('K')) {
    // console.log('adding an SKKM symbol')
    options.dtg = 'SKKM 31mar22'
    options.direction = 123
    options.speed = 44
    options.additionalInformation = 'SKKM additional'
    options.staffComment = 'SKKM staffComment'
    options.higherFormation = 'SKKM higher'
    options.uniqueDesignation = 'SKKM unique'
    options.frame = false
  }
  const symbol = new ms.Symbol(actualSIDC, { ...options, ...(properties ? properties.options : {}) })
  if (actualSIDC.startsWith('K')) {
    console.dir(symbol)
  }
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

  if (symbol.validIcon) {
    const marker = geometry.getType() === 'Point'
      ? pointStyle()
      : lineStringStyle()

    return [
      ...marker,
      ...(mode === 'multi' ? factory.handles(feature.getGeometry()) : [])
    ].flat()

  } else return defaultStyle(feature)
}

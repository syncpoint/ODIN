/* eslint-disable */

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import L from 'leaflet'
import * as R from 'ramda'
import uuid from 'uuid-random'
import { K } from '../../../shared/combinators'


/**
 *
 */
const translate = style => ({
  stroke: style['stroke'],
  strokeWidth: style['stroke-width'],
  strokeLinejoin: style['stroke-linejoin'],
  strokeDasharray: style['stroke-dasharray'],
  fill: style['fill'],
  opacity: style['opacity']
})


/**
 *
 */
const lineProperties = line => {
  if (!line) return { content: '', fontWeight: null }
  const match = line.match(/<bold>(.*)<\/bold>/)
  const bold = (match && !!match[1]) || false
  return {
    content: bold ? match[1] : line,
    fontWeight: bold ? 'bold' : 'normal'
  }
}


/**
 *
 */
const adjustTextAnchor = (anchor, angle) => {
  if (angle < 90 || angle > 270) return anchor
  switch (anchor) {
    case 'start': return 'end'
    case 'end' : return 'start'
    default: return anchor
  }
}


/**
 *
 */
const labelTransform = (label, box) => {
  const { center, fontSize, angle } = label
  const textAnchor = adjustTextAnchor(label.textAnchor) || 'middle'
  const flip = (angle > 90 && angle < 270) ? -1 : 1
  const ty = fontSize / 2 - box.height / 2
  const tx = textAnchor === 'left'
    ? -box.width / 2
    : textAnchor === 'right'
      ? box.width / 2
      : 0

  const rotate = angle ? `rotate(${angle})` : ''
  const scale = flip === -1 ? `scale(${flip} ${flip})` : ''
  return `translate(${center.x + tx} ${center.y + ty}) ${rotate} ${scale} translate(${-center.x} ${-center.y})`
}

// Lift value from ref:
const current = ref => ref.current


/**
 *
 */
const Label = React.forwardRef((props, ref) => {
  const { x, y, lines } = props
  const fontSize = props.fontSize || 14
  const textAnchor = adjustTextAnchor(props.textAnchor) || 'middle'

  const tspan = ({ content, fontWeight }, index) =>
    <tspan
      key={index}
      x={x} dy={'1.2em'}
      fontWeight={fontWeight}
      alignmentBaseline={'central'}
    >
      {content}
    </tspan>

  const tspans = () => lines
    .slice(1)
    .filter(line => line)
    .map(lineProperties)
    .map(tspan)

  const { content, fontWeight } = lineProperties(lines[0])

  return (
    <text ref={ref}
          fontSize={16} x={x} y={y}
          textAnchor={textAnchor} fontWeight={fontWeight} fontSize={fontSize}
          alignmentBaseline={'central'}
    >
      {content}
      {tspans()}
    </text>
  )
})


/**
 * After render() effect: Transform labels and set clippings masks.
 */
const effect = (labels, refs) => {
  if (!labels || !labels.length) return () => {}

  return () => {
    R.zip(refs.labels.map(current), refs.blackMasks.map(current))
      .forEach(([text, mask], index) => {
        const box = text.getBBox()
        const transform = labelTransform(labels[index], box)
        text.setAttribute('transform', transform)

        // White mask:
        const maskBox = L.SVG.inflate(box, 8)
        const attrs = { x: maskBox.x, y: maskBox.y, width: maskBox.width, height: maskBox.height, transform }
        L.SVG.setAttributes(mask)(attrs)
      })

    const box = refs.defs.current.parentNode.getBBox()
    L.SVG.setAttributes(refs.whiteMask.current)({ ...L.SVG.inflate(box, 20) })
  }
}


/**
 *
 */
const patternFill = (id, styles) => {
  if (styles.fill !== 'diagonal') return { pattern: null, fill: null }

  const patternId = `pattern-${id}`
  const style = styles.path
  const stroke = style.patternStroke || style.stroke

  const pattern = <pattern
    id={patternId}
    patternUnits={'userSpaceOnUse'}
    width={4} height={8}
    patternTransform={'rotate(-45)'}
  >
    <path stroke={stroke} strokeWidth={2} d={'M -1,2 l 6,0'}/>
  </pattern>

  return { fill: `url(#${patternId})`, pattern }
}

/**
 *
 */
const Shape = props => {
  const { id, interactive, styles, d } = props

  // Don't render at all when path is not valid:
  if (d.indexOf('NaN') !== -1) return null

  const className = interactive ? 'leaflet-interactive' : ''
  const refs = { labels: [], blackMasks: [] }

  useEffect(effect(props.labels, refs))

  const labels = props.labels.map((label, index) =>
    <Label key={index} x={label.center.x} y={label.center.y}
           ref={K(React.createRef())(ref => refs.labels.push(ref))}
           lines={label.lines} textAnchor={label.textAnchor}
    />
  )

  const blackMasks = props.labels.map((_, index) =>
    <rect key={index} fill={'black'}
          ref={K(React.createRef())(ref => refs.blackMasks.push(ref))}
    />)

  const pathProperties = {
    id: `path-${id}`,
    shapeRendering: 'optimizeSpeed',
    className: className,
    d
  }

  if (props.labels.length) pathProperties.mask = `url(#mask-${id})`

  const mask = () => props.labels.length
    ? <mask id={`mask-${id}`}>
        <rect ref={K(React.createRef())(ref => refs.whiteMask = ref)} fill={'white'}/>
        {blackMasks}
      </mask>
    : null

  // Path 'path' might get pattern fill:
  const pathStyle = translate(styles['path'])
  const { pattern, fill } = patternFill(id, styles)
  if (fill) pathStyle.fill = fill

  return (<>
    <defs ref={K(React.createRef())(ref => refs.defs = ref)}>
      { pattern }
      { mask() }
      <path {...pathProperties}/>
    </defs>
    {/* re-use path definition with different styles. */}
    <use xlinkHref={`#path-${id}`} {...translate(styles['outline'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(styles['contrast'])}/>
    <use xlinkHref={`#path-${id}`} {...pathStyle}/>
    { labels }
  </>)
}


/**
 *
 */
export const shape = (group, options, callbacks) => {
  const { interactive, hideLabels, lineSmoothing } = options

  const state = {
    lineSmoothing: options.lineSmoothing,
    points: callbacks.points
  }

  const props = {
    id: uuid(),
    labels: [],
    styles: options.styles,
    interactive, lineSmoothing, // as-is
  }

  const center = placement => (
    {
      'function': p => p(state.frame),
      'string': p => state.placements[p],
      'object': p => p
    }[typeof placement](placement)
  )

  const labelProperties = label => ({
    textAnchor: label.anchor || 'middle',
    fontSize: label['font-size'] || 14,
    angle: ('function' === typeof label.angle) ? label.angle(state.frame) : label.angle || 0,
    lines: label.lines,
    center: center(label.placement)
  })

  const render = () => ReactDOM.render(<Shape {...props}/>, group)

  const updateLabels = options => {
    if (hideLabels) return []

    const labels = (typeof options.labels) === 'function'
      ? options.labels(state.frame)
      : options.labels

    return labels.map(labelProperties).filter(props => props.center)
  }

  return {
    updateFrame: frame => {
      state.frame = frame
      state.placements = callbacks.placements ? callbacks.placements(state.frame) : {}
      props.d = L.SVG.pointsToPath(state.points(state.frame), closed, state.lineSmoothing)
      props.labels = updateLabels(options)
      render()
    },
    updateOptions: options => {
      props.styles = options.styles
      props.labels = updateLabels(options)
      render()
    }
  }
}

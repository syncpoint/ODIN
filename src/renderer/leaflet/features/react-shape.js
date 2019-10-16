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
 *
 */
const Shape = props => {
  const { id, options, d } = props
  const { placements } = props
  const className = options.interactive ? 'leaflet-interactive' : ''

  const refs = {
    labels: [],
    blackMasks: [],
  }

  const current = ref => ref.current

  useEffect(() => {
    R.zip(refs.labels.map(current), refs.blackMasks.map(current))
      .forEach(([text, mask], index) => {
        const label = props.labels[index]
        const {x, y} = placements[label.placement]
        const fontSize = label.fontSize || 14
        const angle = 0
        const textAnchor = adjustTextAnchor(props.textAnchor) || 'middle'

        const textBox = text.getBBox()
        const flip = (angle > 90 && angle < 270) ? -1 : 1
        const ty = fontSize / 2 - textBox.height / 2
        const tx = textAnchor === 'left'
          ? -textBox.width / 2
          : textAnchor === 'right'
            ? textBox.width / 2
            : 0

        const transform = `
          translate(${x + tx} ${y + ty})
          rotate(${angle})
          scale(${flip} ${flip})
          translate(${-x} ${-y})
        `

        text.setAttribute('transform', transform)

        // White mask:
        const maskBox = L.SVG.inflate(textBox, 8)
        const attrs = { x: maskBox.x, y: maskBox.y, width: maskBox.width, height: maskBox.height, transform }
        L.SVG.setAttributes(mask)(attrs)
      })

    const box = refs.defs.current.parentNode.getBBox()
    L.SVG.setAttributes(refs.whiteMask.current)({ ...L.SVG.inflate(box, 20) })
  })

  const labels = props.labels.map((label, index) => {
    const {x, y} = placements[label.placement]
    return (
      <Label key={index} x={x} y={y}
             ref={K(React.createRef())(ref => refs.labels.push(ref))}
             lines={label.lines} anchor={label.anchor}
      />
    )
  })

  const blackMasks = props.labels.map((_, index) => <rect
    key={index}
    ref={K(React.createRef())(ref => refs.blackMasks.push(ref))}
    fill={'black'}
  />)

  return (<>
    <defs ref={K(React.createRef())(ref => refs.defs = ref)}>
      <mask id={`mask-${id}`}>
        <rect ref={K(React.createRef())(ref => refs.whiteMask = ref)} fill={'white'}/>
        {blackMasks}
      </mask>
      <path className={className} id={`path-${id}`} d={d} mask={`url(#mask-${id})`}/>
    </defs>
    {/* re-use path definition with different styles. */}
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['outline'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['contrast'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['path'])}/>
    { labels }
  </>)
}


/**
 *
 */
export const shape = (group, options, callbacks) => {
  const id = uuid()
  const state = { id, options, callbacks, labels: [] }
  const render = () => ReactDOM.render(<Shape {...state}/>, group)
  if ('object' === typeof options.labels) state.labels = options.labels

  return {
    updateFrame: frame => {
      if ('function' === typeof options.labels) state.labels = options.labels(frame)
      const { closed, lineSmoothing } = state.options
      state.placements = (callbacks.placements && callbacks.placements(frame)) || {}
      state.d = L.SVG.pointsToPath(callbacks.points(frame), closed, lineSmoothing)
      render()
    },
    updateOptions: options => {
      if ('object' === typeof options.labels) state.labels = options.labels
      state.options = options
      render()
    }
  }
}

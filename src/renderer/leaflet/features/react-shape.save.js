/* eslint-disable */

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'
import uuid from 'uuid-random'

const translate = style => ({
  stroke: style['stroke'],
  strokeWidth: style['stroke-width'],
  strokeLinejoin: style['stroke-linejoin'],
  strokeDasharray: style['stroke-dasharray'],
  fill: style['fill'],
  opacity: style['opacity']
})

const lineProperties = line => {
  if (!line) return { content: '', fontWeight: null }
  const match = line.match(/<bold>(.*)<\/bold>/)
  const bold = (match && !!match[1]) || false
  return {
    content: bold ? match[1] : line,
    fontWeight: bold ? 'bold' : 'normal'
  }
}

const Equals = {
  SVGRect: (a, b) =>
    a.x === b.x && a.y === b.y &&
    a.width === b.width && a.height === b.height
}

const adjustTextAnchor = (anchor, angle) => {
  if (angle < 90 || angle > 270) return anchor
  switch (anchor) {
    case 'start': return 'end'
    case 'end' : return 'start'
    default: return anchor
  }
}

const Label = props => {
  const { x, y, lines } = props
  const fontSize = props.fontSize || 14
  const angle = 0
  const textAnchor = adjustTextAnchor(props.textAnchor) || 'middle'

  const ref = React.createRef()
  const [bbox, setBBox] = useState(null)
  const [transform, setTransform] = useState(null)

  useEffect(() => {
    const box = ref.current.getBBox()
    if (bbox && Equals.SVGRect(box, bbox)) return
    setBBox(box)

    // TODO: propagate matrix to parent (callback)

    const ty = fontSize / 2 - box.height / 2
    const tx = textAnchor === 'left'
      ? -box.width / 2
      : textAnchor === 'right'
        ? box.width / 2
        : 0

    const flip = (angle > 90 && angle < 270) ? -1 : 1
    setTransform(`
      translate(${x + tx} ${y + ty})
      rotate(${angle})
      scale(${flip} ${flip})
      translate(${-x} ${-y})
    `)

    props.callback(box, transform)
  })

  const tspans = () => lines
    .slice(1)
    .filter(line => line)
    .map(lineProperties)
    .map(({ content, fontWeight }, index) => {
      return (
        <tspan key={index} x={x} dy={'1.2em'} fontWeight={fontWeight} alignmentBaseline={'central'}>
          {content}
        </tspan>
      )
    })

  const { content, fontWeight } = lineProperties(lines[0])
  return (
    <text ref={ref} fontSize={16} x={x} y={y}
          textAnchor={textAnchor} fontWeight={fontWeight} fontSize={fontSize}
          alignmentBaseline={'central'}
          transform={transform}>
      {content}
      {tspans()}
    </text>
  )
}


const BlackMask = props => {
  console.log('props', props)
  if (!props.box || !props.transform) return null
  const box = L.SVG.inflate(props.box, 8)
  const ps = { x: box.x, y: box.y, width: box.width, height: box.height, transform: props.transform }
  return <rect fill={'black'} {...ps}/>
}

const MLabel = React.memo(Label, R.equals)
const MBlackMask = React.memo(BlackMask, R.equals)

const Shape = props => {
  const { id, options, d } = props
  const { placements } = props
  const className = options.interactive ? 'leaflet-interactive' : ''

  const groupRef = React.createRef()
  const whiteMaskRef = React.createRef()

  useEffect(() => {
    const box = groupRef.current.getBBox()
    L.SVG.setAttributes(whiteMaskRef.current)({ ...L.SVG.inflate(box, 20) })
  })

  const [blackBoxes, setBlackBoxes] = useState(new Array(props.labels.length))
  const [transforms, setTransforms] = useState(new Array(props.labels.length))

  const callback = index => (box, transform) => {
    transforms[index] = transform
    setTransforms(transforms)
    blackBoxes[index] = box
    setBlackBoxes(blackBoxes)
  }

  const blackMasks = props.labels.map((label, index) => {
    return <MBlackMask key={index} box={blackBoxes[index]} transform={transforms[index]}/>
  })

  const labels = props.labels.map((label, index) => {
    const {x, y} = placements[label.placement]
    return (
      <MLabel key={index} x={x} y={y}
              lines={label.lines} anchor={label.anchor}
              callback={callback(index)}
      />
    )
  })

  return (
    <g ref={groupRef}>
      <defs>
        <mask id={`mask-${id}`}>
          <rect ref={whiteMaskRef} fill={'white'}/>
          { blackMasks }
        </mask>
        <path className={className} id={`path-${id}`} d={d}/>
      </defs>
      {/* re-use path definition with different styles. */}
      <use xlinkHref={`#path-${id}`} {...translate(options.styles['outline'])}/>
      <use xlinkHref={`#path-${id}`} mask={`url(#mask-${id})`} {...translate(options.styles['contrast'])}/>
      <use xlinkHref={`#path-${id}`} mask={`url(#mask-${id})`} {...translate(options.styles['path'])}/>
      { labels }
    </g>
  )
}

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

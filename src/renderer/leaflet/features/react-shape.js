/* eslint-disable */
/* eslint-disable react/prop-types */

import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import L from 'leaflet'
import uuid from 'uuid-random'
import { K } from '../../../shared/combinators'
import transformation from './transformation'


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


// Lift value from ref:
const current = ref => ref.current


/**
 *
 */
const Label = React.forwardRef((props, ref) => {
  const { x, y, lines, fontSize } = props
  const textAnchor = adjustTextAnchor(props.textAnchor) || 'middle'

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
    <g ref={ref}>
      <text
        x={x} y={y}
        textAnchor={textAnchor} fontWeight={fontWeight} fontSize={fontSize}
        alignmentBaseline={'central'}
        strokeWidth={2} stroke={'white'} fill={'none'}
        strokeLinecap={'round'} strokeLinejoin={'round'}
        // auto (default) | optimizeSpeed | optimizeLegibility | geometricPrecision
        textRendering={'auto'}
      >
        {content}
        {tspans()}
      </text>
      <text
        x={x} y={y}
        textAnchor={textAnchor} fontWeight={fontWeight} fontSize={fontSize}
        alignmentBaseline={'central'}
        stroke={'none'} fill={'blank'}
      >
        {content}
        {tspans()}
      </text>
    </g>
  )
})


/**
 * TODO: upgrade echelon to react
 * TODO: <use/> globally defined paths
 */
const Glyph = React.forwardRef(({ glyph }, ref) => {
  useEffect(() => {
    const parent = ref.current
    while (parent.firstChild) parent.removeChild(parent.firstChild)
    parent.appendChild(glyph)
  })

  return <g ref={ref}/>
})



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


const boxPoints = box => [
  L.point(box.x, box.y),
  L.point(box.x + box.width, box.y),
  L.point(box.x + box.width, box.y + box.height),
  L.point(box.x, box.y + box.height),
  L.point(box.x, box.y)
]


/**
 *
 */
const Shape = props => {
  const { id, interactive, styles, d } = props

  // Don't render at all when path is not valid:
  if (d.indexOf('NaN') !== -1) return null

  const className = interactive ? 'leaflet-interactive' : ''
  const refs = { labels: [] }
  const root = () => refs.defs.current.parentNode
  const [ clipPath, setClipPath ] = useState('')
  const clipping = props.labels.length

  const effect = () => {
    const labelPoints = refs.labels.map(current).map((text, index) => {
      const label = props.labels[index]
      const box = L.SVG.inflate(text.getBBox(), 4)
      const T = transformation(box)(label)
      text.setAttribute('transform', T.matrix)
      return T.points(boxPoints(box))
    })

    const box = L.SVG.inflate(root().getBBox(), 8)
    const points = labelPoints.reduce((acc, points) => acc.concat(points), boxPoints(box))
    const reverse = labelPoints.reverse().reduce((acc, points) => {
      acc.push(points[0])
      return acc
    }, [])

    setClipPath(L.SVG.pointsToPath([points.concat(reverse)], false, false))
  }

  if (clipping) useEffect(effect)

  const labels = props.labels.map((label, index) =>
    label.lines
      ? <Label key={index}
        x={label.center.x} y={label.center.y}
        ref={K(React.createRef())(ref => refs.labels.push(ref))}
        lines={label.lines} textAnchor={label.textAnchor}
      />
      : <Glyph key={index}
        glyph={label.glyph}
        ref={K(React.createRef())(ref => refs.labels.push(ref))}
      />
  )

  const pathProperties = {
    id: `path-${id}`,
    // auto (default) | optimizeSpeed | crispEdges | geometricPrecision
    shapeRendering: 'auto',
    className,
    d
  }

  // Path 'path' might get pattern fill:
  const pathStyle = styles['path']
  const { pattern, fill } = patternFill(id, styles)
  if (fill) pathStyle.fill = fill

  const [clip, clipRef] = clipping
    ? [
        <clipPath id={`clip-${id}`} clipRule={'evenodd'}>
          <path d={clipPath}/>
        </clipPath>,
        `url(#clip-${id})`
      ]
    : [null, null]

  return (<>
    <defs ref={K(React.createRef())(ref => (refs.defs = ref))}>
      { pattern }
      <path {...pathProperties}/>
      { clip }
    </defs>
    {/* re-use path definition with different styles. */}
    <use xlinkHref={`#path-${id}`} {...styles['outline']}/>
    <use xlinkHref={`#path-${id}`} {...styles['contrast']} clipPath={clipRef}/>
    <use xlinkHref={`#path-${id}`} {...pathStyle} clipPath={clipRef}/>
    { labels }
  </>)
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
export const shape = (group, options, callbacks) => {
  const { interactive, hideLabels, lineSmoothing } = options

  const state = {
    lineSmoothing: options.lineSmoothing,
    points: callbacks.points,
    labels: options.labels
  }

  const props = {
    id: uuid(),
    labels: [],
    styles: options.styles,
    interactive,
    lineSmoothing
  }

  const center = placement => (
    {
      'function': p => p(state.frame),
      'string': p => state.placements[p],
      'object': p => p
    }[typeof placement](placement)
  )

  const labelProperties = label => {
    const angle = (typeof label.angle === 'function') ? label.angle(state.frame) : label.angle || 0
    const textAnchor = adjustTextAnchor(label.anchor || 'middle', angle)
    return {
      angle,
      textAnchor,
      fontSize: label['font-size'] || 14,
      lines: label.lines,
      glyph: label.glyph,
      offset: label.offset,
      scale: label.scale,
      center: center(label.placement)
    }
  }

  const render = () => {
    ReactDOM.render(<Shape {...props}/>, group)
  }

  const updateLabels = () => {
    if (hideLabels) return []

    const labels = (typeof state.labels) === 'function'
      ? state.labels(state.frame)
      : state.labels

    return labels.map(labelProperties).filter(props => props.center)
  }

  return {
    updateFrame: frame => {
      state.frame = frame
      state.placements = callbacks.placements ? callbacks.placements(state.frame) : {}
      props.d = L.SVG.pointsToPath(state.points(state.frame), closed, state.lineSmoothing)
      props.labels = updateLabels()
      render()
    },
    updateOptions: options => {
      state.labels = options.labels
      props.styles = options.styles
      props.labels = updateLabels()
      render()
    }
  }
}

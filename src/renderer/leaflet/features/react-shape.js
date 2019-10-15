/* eslint-disable */

import React from 'react'
import ReactDOM from 'react-dom'
import uuid from 'uuid-random'

const translate = style => ({
  stroke: style['stroke'],
  strokeWidth: style['stroke-width'],
  strokeLinejoin: style['stroke-linejoin'],
  strokeDasharray: style['stroke-dasharray'],
  fill: style['fill'],
  opacity: style['opacity']
})

const lineProps = line => {
  if (!line) return { content: '', fontWeight: null }
  const match = line.match(/<bold>(.*)<\/bold>/)
  const bold = (match && !!match[1]) || false
  return {
    content: bold ? match[1] : line,
    fontWeight: bold ? 'bold' : null
  }
}


const Shape = props => {
  const { id, options, d } = props
  const { placements } = props
  const className = options.interactive ? 'leaflet-interactive' : ''

  const labels = (options.labels || []).map((label, index) => {
    const {x, y} = placements[label.placement]

    const tspans = () => label.lines
      .filter(line => line)
      .slice(1).map(lineProps).map((props, index) => {
        return (
          <tspan key={index} x={x} dy={'1.2em'} fontWeight={props.fontWeight}>
            {props.content}
          </tspan>
        )
      })

    const props = lineProps(label.lines[0])
    return (
      <text key={index} fontSize={16} x={x} y={y} textAnchor='middle' fontWeight={props.fontWeight}>
        {props.content}
        {tspans()}
      </text>
    )
  })

  return (<>
    <defs>
      <path className={className} id={`path-${id}`} d={d}/>
    </defs>
    {/* re-use path definition with different styles. */}
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['outline'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['contrast'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['path'])}/>
    { labels }
  </>)
}

export const shape = (group, options, callbacks) => {
  const id = uuid()
  const state = { id, options, callbacks }
  const render = () => ReactDOM.render(<Shape {...state}/>, group)

  if ('object' === typeof options.labels) state.labels = options.labels

  return {
    updateFrame: frame => {
      const { closed, lineSmoothing } = state.options
      state.placements = (callbacks.placements && callbacks.placements(frame)) || {}
      state.d = L.SVG.pointsToPath(callbacks.points(frame), closed, lineSmoothing)
      render()
    },
    updateOptions: options => {
      state.options = options
      render()
    }
  }
}

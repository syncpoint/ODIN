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

const Shape = props => {
  const { id, options, d } = props
  const { placements } = props
  const className = options.interactive ? 'leaflet-interactive' : ''

  const labels = (options.labels || []).map((label, index) => {
    const {x, y} = placements[label.placement]
    return (
      // TODO: line 0 => text, line 1, 2, ... => tspan
      <text key={index} fontSize={16} x={x} y={y} textAnchor='middle'>
        {label.lines[0]}
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

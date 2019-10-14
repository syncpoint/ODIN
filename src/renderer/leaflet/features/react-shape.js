/* eslint-disable */

import React from 'react'
import ReactDOM from 'react-dom'
import uuid from 'uuid-random'

const noop = () => {}

const randomColor = () => {
  var letters = '0123456789ABCDEF'
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color
}

const translate = style => ({
  stroke: style['stroke'],
  strokeWidth: style['stroke-width'],
  strokeLinejoin: style['stroke-linejoin'],
  strokeDasharray: style['stroke-dasharray'],
  fill: style['fill'],
  opacity: style['opacity']
})

const Path = props => {
  return <path {...props}/>
}

const Shape = props => {
  const { id, options, d } = props
  const className = options.interactive ? 'leaflet-interactive' : ''

  return (<>
    <defs>
      <path className={className} id={`path-${id}`} d={d}/>
    </defs>
    {/* re-use path definition with different styles. */}
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['outline'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['contrast'])}/>
    <use xlinkHref={`#path-${id}`} {...translate(options.styles['path'])}/>
    <g></g>
  </>)
}

export const shape = (group, options, callbacks) => {
  const props = { options, callbacks }
  props.id = uuid()
  const { closed, lineSmoothing } = options

  ReactDOM.render(<Shape {...props}/>, group)

  return {
    updateFrame: frame => {
      const d = L.SVG.pointsToPath(callbacks.points(frame), closed, lineSmoothing)
      ReactDOM.render(<Shape {...props} d={d}/>, group)
    }
  }
}

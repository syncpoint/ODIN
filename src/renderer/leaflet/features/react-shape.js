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
  const id = uuid()
  const state = { id, options, callbacks }
  const render = () => ReactDOM.render(<Shape {...state}/>, group)

  return {
    updateFrame: frame => {
      const { closed, lineSmoothing } = state.options
      state.d = L.SVG.pointsToPath(callbacks.points(frame), closed, lineSmoothing)
      render()
    },
    updateOptions: options => {
      state.options = options
      render()
    }
  }
}

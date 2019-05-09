import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import { K } from '../shared/combinators'

const rootId = 'root'

// Create root </div> to mount application in:
document.body.appendChild(K(document.createElement('div'))(div => {
  div.id = rootId
}))

ReactDOM.render(
  <App></App>,
  document.getElementById(rootId)
)
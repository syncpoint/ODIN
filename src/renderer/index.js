import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { K } from '../shared/combinators'
import './index.css'

const rootId = 'root'

// Create root </div> to mount application in:
document.body.appendChild(K(document.createElement('div'))(div => {
  div.id = rootId
}))

ReactDOM.render(<App/>, document.getElementById(rootId))

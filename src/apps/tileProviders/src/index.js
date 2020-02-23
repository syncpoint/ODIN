import React from 'react'
import ReactDOM from 'react-dom'
import { K } from '../../../shared/combinators'

const rootId = 'tileManagementRoot'

// Create root </div> to mount application in:
document.body.appendChild(K(document.createElement('div'))(div => {
  div.id = rootId
}))

const sayHi = <h1>Sers, Du Held!</h1>

ReactDOM.render(
  sayHi,
  document.getElementById(rootId)
)

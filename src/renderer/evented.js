import EventEmitter from 'events'
const evented = new EventEmitter()

/* eslint-disable */

const on = evented.__proto__.on
evented.__proto__.on = function (event, listener) {
  console.log('[on]', event, this, new Error())
  on.call(this, event, listener)
  return this
}

export default evented

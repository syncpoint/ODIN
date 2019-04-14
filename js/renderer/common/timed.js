
const of = (initialDelay, callback) => object => {
  let timeout = null

  const clear = () => {
    if (timeout) clearTimeout(timeout)
    timeout = null
  }

  const refresh = delay => {
    clear()
    timeout = setTimeout(callback, delay || initialDelay)
  }

  refresh(initialDelay)

  return Object.assign({}, object, {
    clearTimeout: clear,
    refreshTimeout: refresh
  })
}

module.exports = {
  of
}

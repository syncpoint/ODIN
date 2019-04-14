const K = v => fn => { fn(v); return v }
const noop = () => {}

module.exports = {
  K,
  noop
}

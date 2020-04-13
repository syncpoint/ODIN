export const K = value => fn => { fn(value); return value }
export const noop = () => {}
export const uniq = (value, index, array) => array.indexOf(value) === index

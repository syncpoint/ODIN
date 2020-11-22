import * as R from 'ramda'
import { transform } from './utm'
import * as TS from './ts'

export const format = origin => {
  const { toUTM, fromUTM } = transform(origin)
  return {
    read: R.compose(TS.read, toUTM),
    write: R.compose(fromUTM, TS.write)
  }
}

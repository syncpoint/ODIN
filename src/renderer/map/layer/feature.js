import { Vector } from 'ol/layer'
import style from '../style/style'

/**
 * Vector layer for tactical features.
 * Uses one style function for all possible features.
 *
 * @param {ol/source/Vector} source vector source
 */
export const feature = source => new Vector({
  style,
  source
})

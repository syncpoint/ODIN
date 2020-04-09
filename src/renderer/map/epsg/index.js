import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import projections from './epsg.json'

projections.forEach(projection => {
  proj4.defs(projection.code, projection.definition)
})

/* make projections available to OL */
register(proj4)

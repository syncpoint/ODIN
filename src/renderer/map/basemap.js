import project from '../project'
import { Tile as TileLayer } from 'ol/layer'

/* extends OL's projection definitions */
import './epsg'
import { defaultSource, from } from './sources'


let olMap = null

const use = source => {
  /* switch basemap using source */
}

const handleProjectLifecycle = async action => {
  if (action !== 'open') return

  const source = project.preferences().basemap
  const tileSource = await (source ? from(source) : defaultSource())

  olMap.getLayers().insertAt(0, new TileLayer({ source: tileSource }))
}

project.register(handleProjectLifecycle)

export default map => {
  olMap = map
  return {
    use
  }
}

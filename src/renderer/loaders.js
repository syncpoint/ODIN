import { Pool } from 'pg'

const pool = new Pool({
  database: 'scen'
})

/**
 * NOTE: function is bound to underlaying VectorSource.
 */
const mipdb = async function (extent, resolution, projection) {
  const oneOIG =
    `SELECT layer
     FROM   public.contxts
     JOIN   public.oigs USING (oig_id)
     JOIN   gis.layers USING (contxt_id)
     WHERE  oig_name_txt = 'SCEN | PLNORD | OVERLAY ORDER NO. 4 (XXX) [CIAVX]'`

  const now = Date.now()
  const result = await pool.query(oneOIG)
  result.rows.forEach(context => {
    const features = this.getFormat().readFeatures(context.layer, { featureProjection: 'EPSG:3857' })
    const validFeatures = features.filter(feature => feature.getGeometry())
    this.addFeatures(validFeatures)
  })

  /* eslint-disable no-new */
  new Notification('ODIN', {
    body: `Loaded ${this.getFeatures().length} features from ${result.rows.length} contexts in ${Date.now() - now} ms.`,
    requireInteraction: true
  })
}

export default {
  mipdb
}

import { Pool } from 'pg'

const pool = new Pool({
  database: 'scen'
})

/**
 * NOTE: function is bound to underlying VectorSource.
 */
const mipdb = function (extent, resolution, projection) {
  const query = `
    SELECT gis.features(contxt.contxt_id, ${extent.join(',')}) AS features
    FROM   contxt
    JOIN   contxt_assoc ON contxt_id = subj_contxt_id AND contxt_assoc.cat_code = 'ISPART'
    JOIN   contxt_assoc_stat USING (subj_contxt_id, obj_contxt_id)
    JOIN   contxt oig ON oig.contxt_id = obj_contxt_id
    WHERE  oig.name_txt = 'SCEN | PLNORD | OVERLAY ORDER NO. 4 (XXX) [CIAVX]'
  `

  const format = this.getFormat()
  const readFeatures = row => format.readFeatures(row.features)
  pool.query(query).then(result => {
    const features = result.rows.flatMap(readFeatures)
    this.clear(true)
    this.addFeatures(features)
  })
}

export default {
  mipdb
}

import { Pool } from 'pg'

const pool = new Pool({
  database: 'scen'
})

/**
 * NOTE: function is bound to underlying VectorSource.
 */
const mipdb = function (extent, resolution, projection) {
  const query = {
    text: `
      SELECT contxt_id,
             oig_name_txt AS layer_group,
             contxt_name_txt AS layer,
             security_policy_txt AS security_policy,
             gis.overlay(contxt_id, ${extent.join(',')}) AS features
      FROM   contxts
      LEFT   JOIN oigs USING (oig_id)
      WHERE  oig_name_txt = 'SCEN | PLNORD | OVERLAY ORDER NO. 4 (XXX) [CIAVX]'
    `,
    rowMode: 'array'
  }

  const format = this.getFormat()
  const readFeatures = row => format.readFeatures(row[4])

  pool.query(query).then(result => {
    const features = result.rows.flatMap(readFeatures)
    this.clear(true)
    this.addFeatures(features)
  })
}

export default {
  mipdb
}

/* eslint-disable */

const coordsToLatLngs = geojson =>
  L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1)

const area = (geojson, options) => new L.Area(coordsToLatLngs(geojson), {
  ...options,
  t: geojson.properties.t || geojson.title
})

const typedArea = type => (geojson, options) => new L.Area(coordsToLatLngs(geojson), {
  ...options,
  type,
  t: geojson.properties.t || geojson.title
})

// functionId(sidc) -> SVG vector factory
export default {

  /* GENERAL AREA */
  'GAG---': area,

  /* ASSEMBLY AREA */
  'GAA---': typedArea('AA'),

  /* GENERAL - AREAS - ENGAGEMENT AREA */
  'GAE---': typedArea('EA'),

  /* DROP ZONE */
  'GAD---': typedArea('DZ'),

  /* EXTRACTION ZONE */
  'GAX---': typedArea('EZ'),

  /* LANDING ZONE */
  'GAL---': typedArea('LZ'),

  /* PICKUP ZONE */
  'GAP---': typedArea('PZ'),

  /* BATTLE POSITION */
  'DAB---': area,

  // /* BATTLE POSITION - PREPARED BUT NOT OCCUPIED */
  // 'DABP--': {
  //   /* `T` Prefixed by '(P)', echelon on boundary (1 x) */
  //   label: T => `(P) ${T}`
  // },

  // /* DEFENSE - AREA - ENGAGEMENT AREA */
  // 'DAE---': {},

  /* SPECIAL - AREA - NAMED AREA OF INTEREST (NAI) */
  'SAN---': typedArea('NAI'),

  /* SPECIAL - AREA - TARGETED AREA OF INTEREST (TAI) */
  'SAT---': typedArea('TAI'),

  /* SPECIAL - AREA - AREA OF OPERATIONS (AO) */
  'SAO---': typedArea('AO'),

  /* OFFENSE - AREA - ATTACK POSITION */
  'OAK---': typedArea('ATK'),

  /* OFFENSE - AREA - ASSAULT POSITION */
  'OAA---': typedArea('ASLT PSN'),

  /* OFFENSE - AREA - OBJECTIVE */
  'OAO---': typedArea('OBJ'),

  /* OFFENSE - AREA - PENETRATION BOX */
  'OAP---': area,

  // /* OBSTACLES - MINEFIELDS - MINED AREA */
  // 'OFA---': { /* 'M's on boundary */ }
}

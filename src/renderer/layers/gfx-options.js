/* eslint-disable */

const options = {
  /* GENERAL AREA */
  'GAG---': {},

  /* ASSEMBLY AREA */
  'GAA---': { type: 'AA' },

  /* GENERAL - AREAS - ENGAGEMENT AREA */
  'GAE---': { type: 'EA' },

  /* DROP ZONE */
  'GAD---': { type: 'DZ' },

  /* EXTRACTION ZONE */
  'GAX---': { type: 'EZ' },

  /* LANDING ZONE */
  'GAL---': { type: 'LZ' },

  /* PICKUP ZONE */
  'GAP---': { type: 'PZ' },

  /* BATTLE POSITION */
  'DAB---': {},

  /* BATTLE POSITION - PREPARED BUT NOT OCCUPIED */
  'DABP--': {
    /* `T` Prefixed by '(P)', echelon on boundary (1 x) */
    label: T => `(P) ${T}`
  },

  /* DEFENSE - AREA - ENGAGEMENT AREA */
  'DAE---': {},

  /* SPECIAL - AREA - NAMED AREA OF INTEREST (NAI) */
  'SAN---': { type: 'NAI' },

  /* SPECIAL - AREA - TARGETED AREA OF INTEREST (TAI) */
  'SAT---': { type: 'TAI' },

  /* SPECIAL - AREA - AREA OF OPERATIONS (AO) */
  'SAO---': { type: 'AO' },

  /* OFFENSE - AREA - ATTACK POSITION */
  'OAK---': { type: 'ATK' },

  /* OFFENSE - AREA - ASSAULT POSITION */
  'OAA---': { type: 'ASLT PSN' },

  /* OFFENSE - AREA - OBJECTIVE */
  'OAO---': { type: 'OBJ' },

  /* OFFENSE - AREA - PENETRATION BOX */
  'OAP---': {},

  /* OBSTACLES - MINEFIELDS - MINED AREA */
  'OFA---': { /* 'M's on boundary */ }
}

export default options
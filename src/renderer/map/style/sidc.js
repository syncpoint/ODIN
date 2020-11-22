// TODO: merge with src/renderer/components/SIDC

export const normalize = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : sidc

/** identity or U - UNKNOWN */
export const identity = sidc => sidc
  ? sidc[1]
  : 'U'

/** status or P - PRESENT */
export const status = sidc => sidc
  ? sidc[3]
  : 'P'

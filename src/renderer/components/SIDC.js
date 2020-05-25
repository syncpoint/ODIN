const HOSTILITY = 1
const STATUS = 3
const MODIFIER = 10
const MOBILITY = 10
const INSTALLATION = 10
const ECHELON = 11

const part = (index, n = 1) => ({
  replace: v => s => s.substring(0, index) + v + s.substring(index + v.length),
  value: s => s.substring(index, index + n)
})

export const hostilityPart = part(HOSTILITY)
export const statusPart = part(STATUS)
export const modifierPart = part(MODIFIER)
export const mobilityPart = part(MOBILITY, 2)
export const installationPart = part(INSTALLATION)
export const echelonPart = part(ECHELON)
export const parameterized =
  sidc =>
    `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`

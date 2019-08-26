export const featureClasses = {
  U: { description: 'Units', patterns: [/^S.G.U.*$/] },
  E: { description: 'Equipment', patterns: [/^S.G.E.*$/] },
  I: { description: 'Installations', patterns: [/^S.G.I.*$/] }, // S.G.......H.*
  SI: { description: 'Signals Intelligence', patterns: [/^I.*$/] },
  SO: { description: 'Stability Operations', patterns: [/^O.*$/] },
  EU: { description: 'EMS Units' },
  EE: { description: 'EMS Equipment and Incidents', patterns: [/^E.I.*$/] },
  EI: { description: 'EMS Installations', patterns: [/^E.O.......H.*$/, /^E.F.......H.*$/] },
  P: { description: 'Points', patterns: [/^G.G.GP.*$/, /G.G.AP.*/] },
  L: { description: 'Lines' },
  A: { description: 'Areas', patterns: [/^G.G.SA.*$/] },
  N: { description: 'Nuclear' },
  BL: { description: 'Boundary Lines', patterns: [/^G.G.GLB---....X$/] },
  'B/C': { description: 'Bio/Chemical' }
}

import L from 'leaflet'
import '../NamedArea'
import './TACGRP.C2GM.GNL.LNE.BNDS'

L.Feature['G*G*GAA---'] = L.Feature.NamedArea.extend({ name: 'AA' })
L.Feature['G*G*GAE---'] = L.Feature.NamedArea.extend({ name: 'EA' })
L.Feature['G*G*GAD---'] = L.Feature.NamedArea.extend({ name: 'DZ' })
L.Feature['G*G*GAX---'] = L.Feature.NamedArea.extend({ name: 'EZ' })
L.Feature['G*G*GAP---'] = L.Feature.NamedArea.extend({ name: 'PZ' })
L.Feature['G*G*GAL---'] = L.Feature.NamedArea.extend({ name: 'LZ' })
L.Feature['G*G*OAK---'] = L.Feature.NamedArea.extend({ name: 'ATK' })
L.Feature['G*G*OAO---'] = L.Feature.NamedArea.extend({ name: 'OBJ' })
L.Feature['G*G*SAO---'] = L.Feature.NamedArea.extend({ name: 'AO' })
L.Feature['G*G*SAN---'] = L.Feature.NamedArea.extend({ name: 'NAI' })
L.Feature['G*G*SAT---'] = L.Feature.NamedArea.extend({ name: 'TAI' })
L.Feature['G*G*DAB---'] = L.Feature.Polygon // TODO: needs echelon
L.Feature['G*F*ATS---'] = L.Feature.NamedArea.extend({ name: 'SMOKE' }) // TODO: W/W1
L.Feature['G*S*AR----'] = L.Feature.NamedArea.extend({ name: 'FARP' }) // TODO: W/W1

// NOTE: No distinction: IRREGULAR/RECTANGULAR, but no CIRCULAR
L.Feature['G*F*ACFI--'] = L.Feature.NamedArea.extend({ name: 'FFA' }) // TODO: W/W1
L.Feature['G*F*ACFR--'] = L.Feature.NamedArea.extend({ name: 'FFA' }) // TODO: W/W1
L.Feature['G*F*ACNI--'] = L.Feature.NamedArea.extend({ name: 'NFA' }) // TODO: W/W1, fill pattern
L.Feature['G*F*ACNR--'] = L.Feature.NamedArea.extend({ name: 'NFA' }) // TODO: W/W1, fill pattern
L.Feature['G*F*ACRI--'] = L.Feature.NamedArea.extend({ name: 'RFA' }) // TODO: W/W1
L.Feature['G*F*ACRR--'] = L.Feature.NamedArea.extend({ name: 'RFA' }) // TODO: W/W1

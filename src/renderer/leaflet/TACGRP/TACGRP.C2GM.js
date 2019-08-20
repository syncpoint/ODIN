import L from 'leaflet'
import '../NamedArea'
import './TACGRP.C2GM.GNL.LNE.BNDS'

L.Feature['G*G*GAA---****X'] = L.Feature.NamedArea.extend({ name: 'AA' })
L.Feature['G*G*GAE---****X'] = L.Feature.NamedArea.extend({ name: 'EA' })
L.Feature['G*G*GAD---****X'] = L.Feature.NamedArea.extend({ name: 'DZ' })
L.Feature['G*G*GAX---****X'] = L.Feature.NamedArea.extend({ name: 'EZ' })
L.Feature['G*G*GAP---****X'] = L.Feature.NamedArea.extend({ name: 'PZ' })

// OFFENSE (TACGRP.C2GM.OFF.ARS)
L.Feature['G*G*OAK---****X'] = L.Feature.NamedArea.extend({ name: 'ATK' })
L.Feature['G*G*OAO---****X'] = L.Feature.NamedArea.extend({ name: 'OBJ' })

// SPECIAL (TACGRP.C2GM.SPL)
L.Feature['G*G*SAO---****X'] = L.Feature.NamedArea.extend({ name: 'AO' })
L.Feature['G*G*SAN---****X'] = L.Feature.NamedArea.extend({ name: 'NAI' })
L.Feature['G*G*SAT---****X'] = L.Feature.NamedArea.extend({ name: 'TAI' })

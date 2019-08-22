import L from 'leaflet'
import '../NamedArea'
import './TACGRP.C2GM.GNL.LNE.BNDS'

L.Feature['G*G*GAA---'] = L.Feature.NamedArea.extend({ name: 'AA' })
L.Feature['G*G*GAE---'] = L.Feature.NamedArea.extend({ name: 'EA' })
L.Feature['G*G*GAD---'] = L.Feature.NamedArea.extend({ name: 'DZ' })
L.Feature['G*G*GAX---'] = L.Feature.NamedArea.extend({ name: 'EZ' })
L.Feature['G*G*GAP---'] = L.Feature.NamedArea.extend({ name: 'PZ' })

// OFFENSE (TACGRP.C2GM.OFF.ARS)
L.Feature['G*G*OAK---'] = L.Feature.NamedArea.extend({ name: 'ATK' })
L.Feature['G*G*OAO---'] = L.Feature.NamedArea.extend({ name: 'OBJ' })

// SPECIAL (TACGRP.C2GM.SPL)
L.Feature['G*G*SAO---'] = L.Feature.NamedArea.extend({ name: 'AO' })
L.Feature['G*G*SAN---'] = L.Feature.NamedArea.extend({ name: 'NAI' })
L.Feature['G*G*SAT---'] = L.Feature.NamedArea.extend({ name: 'TAI' })

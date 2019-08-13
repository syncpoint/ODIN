import L from 'leaflet'
import '../shapes/L.Shape.NamedArea'
import './L.TACGRP.C2GM.GNL.LNE.BNDS'

L.Shape['G*G*GAA---*****'] = L.Shape.NamedArea.extend({ name: 'AA' })
L.Shape['G*G*GAE---*****'] = L.Shape.NamedArea.extend({ name: 'EA' })
L.Shape['G*G*GAD---*****'] = L.Shape.NamedArea.extend({ name: 'DZ' })
L.Shape['G*G*GAX---*****'] = L.Shape.NamedArea.extend({ name: 'EZ' })
L.Shape['G*G*GAP---*****'] = L.Shape.NamedArea.extend({ name: 'PZ' })

// OFFENSE (TACGRP.C2GM.OFF.ARS)
L.Shape['G*G*OAK---*****'] = L.Shape.NamedArea.extend({ name: 'ATK' })
L.Shape['G*G*OAO---*****'] = L.Shape.NamedArea.extend({ name: 'OBJ' })

// SPECIAL (TACGRP.C2GM.SPL)
L.Shape['G*G*SAO---*****'] = L.Shape.NamedArea.extend({ name: 'AO' })
L.Shape['G*G*SAN---*****'] = L.Shape.NamedArea.extend({ name: 'NAI' })
L.Shape['G*G*SAT---*****'] = L.Shape.NamedArea.extend({ name: 'TAI' })

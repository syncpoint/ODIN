import L from 'leaflet'
import '../Fan'

L.Feature['G*G*GAS---'] = L.Fan.extend({
  labelCount: 0,
  label () {
    return []
  }
})

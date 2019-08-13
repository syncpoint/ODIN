import L from 'leaflet'
import evented from '../../evented'
import store from '../../stores/layer-store'


evented.on('MAP_CREATED', map => {

  const addLayer = (name, layer) => {
    new L.Feature.Layer(name, layer.content).addTo(map)
  }

  const addAllLayers = layers => Object.entries(layers)
    .filter(([_, layer]) => layer.show)
    .forEach(([name, layer]) => addLayer(name, layer))

  if (store.ready()) addAllLayers(store.state())
  else store.on('ready', addAllLayers)
})

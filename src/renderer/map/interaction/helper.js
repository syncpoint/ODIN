export const setGeometry = (feature, geometry) => {
  // We maintain original geometry colleciton reference
  // and only updated contained line string and point geometry.
  // This should trigger change event on geometry (collection).
  feature.getGeometry().setGeometries(geometry.getGeometries())

  // Set original geometry reference again to trigger rendering.
  feature.setGeometry(feature.getGeometry())
}

export const setCoordinates = (feature, geometry) => {
  feature.getGeometry().setCoordinates(geometry.getCoordinates())
  feature.setGeometry(feature.getGeometry())
}

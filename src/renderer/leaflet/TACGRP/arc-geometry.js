export const arcGeometry = (latlng, orientation, size, radius) => {
  const O = latlng.destinationPoint(radius, orientation)
  const S = latlng.destinationPoint(radius, orientation + size)
  orientation = orientation - 90

  return {
    latlng,
    O,
    S,
    radius,
    radians: {
      start: orientation / 180 * Math.PI,
      end: (orientation + size) / 180 * Math.PI,
      delta: size / 180 * Math.PI
    }
  }
}

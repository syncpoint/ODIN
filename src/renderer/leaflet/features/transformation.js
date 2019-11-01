import L from 'leaflet'
import * as math from 'mathjs'

// NOTE: Matrix is constructed from columns
const mScale = s => [[s, 0, 0], [0, s, 0], [0, 0, 1]]
const mTranslate = (tx, ty) => [[1, 0, 0], [0, 1, 0], [tx, ty, 1]]
const mRotate = θ => [[Math.cos(θ), Math.sin(θ), 0], [-Math.sin(θ), Math.cos(θ), 0], [0, 0, 1]]
const mTransform = xs => xs.reduce((a, b) => math.multiply(a, b))
const DEG2RAD = Math.PI / 180

export default box => label => {

  const glyph = ({ center, angle, scale, offset }) => [
    mTranslate(offset.x, offset.y),
    mRotate(angle * DEG2RAD),
    mScale(scale),
    mTranslate(center.x, center.y)
  ]

  const text = ({ center, fontSize, textAnchor, angle }, box) => [
    mTranslate(-center.x, -center.y),
    mRotate(angle * DEG2RAD),
    mScale((angle > 90 && angle < 270) ? -1 : 1),
    mTranslate(
      center.x + (textAnchor === 'left' ? -box.width / 2 : textAnchor === 'right' ? box.width / 2 : 0),
      center.y + fontSize / 1.2 - box.height / 2
    )
  ]

  const M = mTransform((label.glyph ? glyph : text)(label, box))

  return {
    matrix: `matrix(${M[0][0]} ${M[0][1]} ${M[1][0]} ${M[1][1]} ${M[2][0]} ${M[2][1]})`,
    points: points => points.map(point => L.point(math.multiply([point.x, point.y, 1], M)))
  }
}

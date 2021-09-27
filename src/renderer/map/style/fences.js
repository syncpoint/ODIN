import * as style from 'ol/style'

export const fenceX = ([point, angle, displacement]) => {
  return new style.Style({
    geometry: point,
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: Math.PI / 4,
      rotation: Math.PI - angle,
      scale: [1, 1.4],
      displacement: displacement || [0, 0]
    })
  })
}

export const fenceO = ([point, angle, displacement]) => new style.Style({
  geometry: point,
  image: new style.RegularShape({
    stroke: new style.Stroke({ color: 'black', width: 3 }),
    points: 8,
    radius: 8,
    radius2: 8,
    angle: Math.PI / 4,
    rotation: Math.PI - angle,
    scale: [0.8, 1.4],
    displacement: displacement || [0, 0]
  })
})

export const fenceDoubleX = ([point, angle]) => [
  new style.Style({
    geometry: point,
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: Math.PI / 4,
      rotation: Math.PI - angle,
      scale: [1, 1.4],
      displacement: [-10, 0]
    })
  }),
  new style.Style({
    geometry: point,
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: Math.PI / 4,
      rotation: Math.PI - angle,
      scale: [1, 1.4],
      displacement: [10, 0]
    })
  })
]

/**
 * @param {*} geometry an OL geometry, usually a LineString
 * @returns The OL style for the default fence line
 */
export const fenceLine = geometry => new style.Style({
  geometry,
  stroke: new style.Stroke({ color: 'black', width: 3 })
})

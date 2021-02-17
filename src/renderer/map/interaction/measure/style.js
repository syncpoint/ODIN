import { Circle as CircleStyle, Fill, Stroke, Style, Text as TextStyle } from 'ol/style'
import GeometryType from 'ol/geom/GeometryType'

export const defaultStyle = text => [
  new Style({
    stroke: new Stroke({
      color: 'hsl(0, 100%, 40%)',
      width: 4
    })
  }),
  new Style({
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }),
  new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({
        color: 'hsl(0, 100%, 40%)'
      })
    })
  }),
  new Style({
    text: new TextStyle({
      font: '16px sans-serif',
      fill: new Fill({
        color: 'black'
      }),
      text: text,
      textAlign: 'end',
      placement: 'point',
      overflow: true,
      textBaseline: 'bottom',
      backgroundFill: new Fill({
        color: 'hsl(0, 0%, 100%)'
      })
    })
  })
]

export const selectedStyle = text => [
  new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 4
    })
  }),
  new Style({
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }),
  new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({
        color: 'blue'
      })
    })
  }),
  new Style({
    text: new TextStyle({
      font: '16px sans-serif',
      fill: new Fill({
        color: 'black'
      }),
      text: text,
      textAlign: 'end',
      placement: 'point',
      overflow: true,
      textBaseline: 'bottom',
      backgroundFill: new Fill({
        color: 'hsl(0, 0%, 100%)'
      })
    })
  })
]

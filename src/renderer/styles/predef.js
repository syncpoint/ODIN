import * as geom from 'ol/geom'
import * as style from 'ol/style'

export const Point = { of: xs => new geom.Point(xs) }
export const LineString = { of: xs => new geom.LineString(xs) }
export const Stroke = { of: props => new style.Stroke(props) }
export const Text = { of: props => new style.Text(props) }
export const Style = { of: props => new style.Style(props) }

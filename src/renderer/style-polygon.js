import { centerLabel, ewLabels } from './style-labels'

const namedCenter = name => ({
  labels: [
    centerLabel(props => [name, props.t]),
    ewLabels(props => props.n === 'ENY' ? ['ENY'] : [])
  ]
})

const style = {
  'G-G-GAA---': namedCenter('AA'),
  'G-G-GAD---': namedCenter('DZ'),
  'G-G-GAE---': namedCenter('EA'),
  'G-G-GAL---': namedCenter('LZ'),
  'G-G-GAP---': namedCenter('PZ'),
  'G-G-GAX---': namedCenter('EZ')
}

const defaultStyle = {
  labels: [
    centerLabel(props => [props.t])
  ]
}

export default {
  style,
  defaultStyle
}

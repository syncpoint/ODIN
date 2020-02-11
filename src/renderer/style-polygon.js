import { centerLabel, ewLabels, nsewLabels, southLabel, northLabel } from './style-labels'

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
  'G-G-GAX---': namedCenter('EZ'),
  'G-M-OFA---': {
    labels: [nsewLabels(() => ['M'])]
  },
  'G-M-OFD---': ({
    labels: [
      centerLabel(props => [props.t]),
      ewLabels(props => props.n === 'ENY' ? ['ENY'] : []),
      northLabel(props => [props.h]),
      southLabel(props => [props.w])
    ]
  })
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

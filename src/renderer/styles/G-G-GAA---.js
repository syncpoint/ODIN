import tacgrp from './tacgrp'
import { centerLabel, ewLabels } from './area-labels'

// ASSEMBLY AREA: TACGRP.C2GM.GNL.ARS.ABYARA
tacgrp['G-G-GAA---'] = {
  labels: feature => [
    centerLabel(props => ['AA', props.t]),
    ewLabels(props => props.n === 'ENY' ? ['ENY'] : [])
  ].flatMap(fn => fn(feature))
}

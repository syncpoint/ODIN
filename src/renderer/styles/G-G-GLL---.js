import tacgrp from './tacgrp'
import lineLabels from './line-labels'

const labels = lineLabels(props => (['LL', props.t ? `(PL ${props.t})` : '']))
tacgrp['G-G-GLL---'] = { labels }

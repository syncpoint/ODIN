import tacgrp from './tacgrp'
import lineLabels from './line-labels'

// LIGHT LINE: TACGRP.C2GM.GNL.LNE.LITLNE
const labels = lineLabels(props => (['LL', props.t ? `(PL ${props.t})` : '']))
tacgrp['G-G-GLL---'] = { labels }

import { tacgrp } from './tacgrp'
import { centerLabel } from './area-labels'

// ENEMY PRISONER OF WAR (EPW) HOLDING AREA: TACGRP.CSS.ARA.EPWHA
const labels = centerLabel(props => ['EPW', 'HOLDING', 'AREA', props.t])
tacgrp['G-S-AE----'] = { labels }

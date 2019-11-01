import L from 'leaflet'
import '../features/FanArea'
import { line } from '../features/geo-helper'

const labels = labelText => () => [
  {
    placement: ({ C, O, rangeO }) => line([C, line([C, O]).translate(-rangeO / 20).point(0.55)]).point(0.3),
    lines: [labelText],
    'font-size': 18,
    angle: ({ orientation }) => orientation - 90
  },
  {
    placement: ({ C, S, rangeS }) => line([C, line([C, S]).translate(rangeS / 20).point(0.55)]).point(0.3),
    lines: [labelText],
    'font-size': 18,
    angle: ({ orientation, size }) => orientation + size - 90
  }
]

const fanArea = labelText => (feature, options) => {
  options.labels = labelText ? labels(labelText) : () => []
  return new L.TACGRP.FanArea(feature, options)
}

L.Feature['G*T*UC----'] = fanArea('C')
L.Feature['G*T*UG----'] = fanArea('G')
L.Feature['G*T*US----'] = fanArea('S')
L.Feature['G*G*GAS---'] = fanArea()

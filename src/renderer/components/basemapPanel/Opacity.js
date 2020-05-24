import React from 'react'
import PropTypes from 'prop-types'
import { Typography, Slider } from '@material-ui/core'

const Opacity = props => {
  const marks = [
    { label: '0%', value: 0 },
    { label: '100%', value: 1 }
  ]

  return (
    <>
      <Typography id="non-linear-slider">
      Basemap Opacity
      </Typography>
      <Slider
        marks={marks}
        min={0}
        max={1}
        scale={v => v * 100}
        step={0.01}
        value={props.value}
        aria-labelledby="non-linear-slider"
        onChange={props.onChange}
      />
    </>
  )
}

Opacity.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
}

export default Opacity

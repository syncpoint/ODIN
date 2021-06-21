import React from 'react'
import PropTypes from 'prop-types'
import { Slider, Typography } from '@material-ui/core'


const SliderSettings = props => {

  const minValue = props.marks.reduce((accu, current) =>
    (current.value < accu) ? current.value : accu, 100)

  const maxValue = props.marks.reduce((accu, current) =>
    (current.value > accu) ? current.value : accu, 0)

  return (
    <>
    <Typography id="discrete-slider-restrict" gutterBottom>
      Line Width
    </Typography>
    <Slider
      aria-labelledby="discrete-slider-restrict"
      step={null}
      valueLabelDisplay="off"
      marks={props.marks}
      defaultValue={props.defaultValue}
      onChange={(_, value) => props.onChange(value)}
      min={minValue}
      max={maxValue}
    />
  </>
  )
}

SliderSettings.propTypes = {
  caption: PropTypes.string,
  defaultValue: PropTypes.number.isRequired,
  marks: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

export default SliderSettings

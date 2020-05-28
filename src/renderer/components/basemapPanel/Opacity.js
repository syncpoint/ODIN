import React from 'react'
import PropTypes from 'prop-types'
import { Typography, Slider } from '@material-ui/core'

import { useTranslation } from 'react-i18next'

const Opacity = props => {
  const { t } = useTranslation()

  const marks = [
    { label: '0%', value: 0 },
    { label: '100%', value: 1 }
  ]

  return (
    <>
      <Typography id="linear-slider">
        {t('basemaps.opacity')}
      </Typography>
      <Slider
        marks={marks}
        min={0}
        max={1}
        scale={v => v * 100}
        step={0.01}
        defaultValue={props.defaultValue}
        aria-labelledby="linear-slider"
        onChange={props.onChange}
      />
    </>
  )
}

Opacity.propTypes = {
  defaultValue: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
}

export default Opacity

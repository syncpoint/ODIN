import React from 'react'
import { PropTypes } from 'prop-types'
import { Card, CardContent, Slider, Typography } from '@material-ui/core'

import { useTranslation } from 'react-i18next'

const XYZOptions = props => {

  const MIN_ZOOM = 0
  const MAX_ZOOM = 22

  const { merge, options } = props
  const { t } = useTranslation()

  const [zoomValues, setZoomValues] = React.useState([options.minZoom || MIN_ZOOM, options.maxZoom || MAX_ZOOM])

  const handleChange = (_, newValue) => {
    setZoomValues(newValue)
    merge({
      minZoom: newValue[0],
      maxZoom: newValue[1]
    })
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography gutterBottom={true}>{t('basemapManagement.xyzZoomOptions')}</Typography>
        <div style={{ marginTop: '3em' }}>
          <Slider
            value={zoomValues}
            onChange={handleChange}
            valueLabelDisplay="on"
            aria-labelledby="range-slider"
            marks={true}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
          />
        </div>
      </CardContent>
    </Card>
  )
}

XYZOptions.propTypes = {
  options: PropTypes.object,
  merge: PropTypes.func
}

export default XYZOptions

import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, FormControl, InputLabel, Input } from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import { useTranslation } from 'react-i18next'

const Url = props => {
  const { classes } = props
  const { t } = useTranslation()

  const [url, setUrl] = React.useState(props.url)
  const [isValid, setIsValid] = React.useState(false)
  const [predictedUrlType, setPredictedURLType] = React.useState(null)

  // TODO: provide reliable url checker
  const isUrl = string => {
    try {
      return Boolean(new URL(string))
    } catch (e) {
      return false
    }
  }

  const xyzType = /\{z\}.*\{x\}.*\{-?y\}/i
  // TODO: improve detection!
  const wmtsType = /WMTS/i

  const handlePropertyChanged = event => {
    setUrl(event.target.value)
  }

  React.useEffect(() => {
    // TODO: reestablish url verification
    const result = isUrl(url)
    setIsValid(result)
    props.onValidation(result)

    let urlType = t('basemapManagement.unknownSource')
    if (xyzType.test(url)) urlType = 'XYZ'
    else if (wmtsType.test(url)) urlType = 'WMTS'
    setPredictedURLType(urlType)
    props.onTypePrediction(urlType)
  }, [url])

  return (
    <Card variant="outlined">
      <CardContent>
        <form id="editURL">
          { predictedUrlType ? <Chip label={predictedUrlType} color='primary' variant='outlined' style={{ float: 'right' }}/> : null }
          <FormControl error={!isValid} fullWidth className={classes.formControl}>
            <InputLabel htmlFor="url">{t('basemapManagement.descriptorUrl')}</InputLabel>
            <Input id="url" name="url" defaultValue={url}
              onChange={handlePropertyChanged}
              onBlur={() => props.onUrlReady(url)}
              autoFocus={true}
            />
          </FormControl>
        </form>
      </CardContent>
    </Card>
  )
}
Url.propTypes = {
  classes: PropTypes.object,
  url: PropTypes.string,
  onValidation: PropTypes.func,
  onTypePrediction: PropTypes.func,
  onUrlReady: PropTypes.func
}

export default Url

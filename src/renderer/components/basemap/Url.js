import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, InputLabel, Input } from '@material-ui/core'
import { useTranslation } from 'react-i18next'

const Url = props => {
  const { classes } = props
  const { t } = useTranslation()

  const [url, setUrl] = React.useState(props.url)
  const [isValid, setIsValid] = React.useState(false)

  const checkUrl = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/

  const handlePropertyChanged = value => {
    setUrl(value)
  }

  React.useEffect(() => {
    handlePropertyChanged(props.url)
  }, [])

  React.useEffect(() => {
    const result = checkUrl.test(url)
    setIsValid(result)
    props.onValidation(result)
  }, [url])

  return (
    <form id="editURL">
      <FormControl error={!isValid} fullWidth className={classes.formControl}>
        <InputLabel htmlFor="url">{t('basemapManagement.descriptorUrl')}</InputLabel>
        <Input id="url" name="url" defaultValue={url}
          onChange={event => handlePropertyChanged(event.target.value)}
        />
      </FormControl>
    </form>
  )
}
Url.propTypes = {
  classes: PropTypes.object,
  url: PropTypes.string,
  onValidation: PropTypes.func
}

export default Url

import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, FormControl, Input, InputLabel } from '@material-ui/core'

import { useTranslation } from 'react-i18next'

const Name = props => {
  const { classes, merge } = props
  const { t } = useTranslation()

  const [name, setName] = React.useState(props.name)
  const [attributions, setAttributions] = React.useState(props.attributions)
  const [isValid, setIsValid] = React.useState(false)

  React.useEffect(() => {
    // name validation
    // TODO: check if name is unique
    const valid = name && name.length > 0
    setIsValid(valid)
    props.onValidation(valid)
  }, [name])

  const handlePropertyChanged = event => {
    setName(event.target.value)
  }

  const handleAttributionsChanged = (event) => {
    setAttributions(event.target.value)
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <div id="editName">
          <FormControl error={!isValid} fullWidth className={classes.formControl}>
            <InputLabel htmlFor="name">{t('basemapManagement.descriptorName')}</InputLabel>
            <Input id="name" name="name" defaultValue={name} autoFocus={true}
              onChange={handlePropertyChanged}
              onBlur={() => props.onNameReady(name)}
            />
          </FormControl>
        </div>
        <div id="editAttribution">
          <FormControl fullWidth className={classes.formControl}>
            <InputLabel htmlFor="attributions">{t('basemapManagement.attributions')}</InputLabel>
            <Input id="attributions" name="attributions" defaultValue={attributions}
              onChange={handleAttributionsChanged}
              onBlur={() => merge('attributions', attributions)}
            />
          </FormControl>
        </div>
      </CardContent>
    </Card>
  )
}
Name.propTypes = {
  classes: PropTypes.object,
  name: PropTypes.string,
  attributions: PropTypes.string,
  merge: PropTypes.func,
  onValidation: PropTypes.func,
  onNameReady: PropTypes.func
}

export default Name

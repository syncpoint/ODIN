import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent, FormControl, Input, InputLabel } from '@material-ui/core'

import { useTranslation } from 'react-i18next'

const Name = props => {
  const { classes } = props
  const { t } = useTranslation()

  const [name, setName] = React.useState(props.name)
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

  return (
    <Card variant="outlined">
      <CardContent>
        <form id="editName">
          <FormControl error={!isValid} fullWidth className={classes.formControl}>
            <InputLabel htmlFor="descriptorName">{t('basemapManagement.descriptorName')}</InputLabel>
            <Input id="name" name="name" defaultValue={name} autoFocus={true}
              onChange={handlePropertyChanged}
              onBlur={() => props.onNameReady(name)}
            />
          </FormControl>
        </form>
      </CardContent>
    </Card>
  )
}
Name.propTypes = {
  classes: PropTypes.object,
  name: PropTypes.string.isRequired,
  onValidation: PropTypes.func,
  onNameReady: PropTypes.func
}

export default Name

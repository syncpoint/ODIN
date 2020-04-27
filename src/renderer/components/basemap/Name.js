import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, Input, InputLabel } from '@material-ui/core'


import { useTranslation } from 'react-i18next'

const Name = props => {
  const { classes } = props
  // const { onNameReady } = props
  const { t } = useTranslation()

  const [name, setName] = React.useState(props.name)

  const handlePropertyChanged = event => {
    setName(event.target.value)
  }

  return (
    <>
      <form id="editName">
        <FormControl error={false} fullWidth className={classes.formControl}>
          <InputLabel htmlFor="descriptorName">{t('basemapManagement.descriptorName')}</InputLabel>
          <Input id="name" name="name" defaultValue={name}
            onChange={handlePropertyChanged}
          />
        </FormControl>
      </form>

    </>
  )
}
Name.propTypes = {
  classes: PropTypes.object,
  name: PropTypes.string.isRequired,
  onNameReady: PropTypes.func
}

export default Name

import React from 'react'
import PropTypes from 'prop-types'
import { TextField } from '@material-ui/core'

const TextProperty = props => {
  const { properties } = props

  // TODO: handle 'ESCAPE': reset to original value
  // TODO: handle 'ENTER': update feature
  // TODO: trim value

  const [value, setValue] = React.useState(properties[props.property] || '')
  const handleBlur = () => {
    properties[props.property] = value
    props.onCommit(properties)
  }

  return (
    <TextField
      className={props.className}
      label={props.label}
      value={value}
      onChange={({ target }) => setValue(target.value)}
      onBlur={handleBlur}
    />
  )
}

TextProperty.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  property: PropTypes.string.isRequired,
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default TextProperty

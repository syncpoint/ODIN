import React from 'react'
import PropTypes from 'prop-types'
import { TextField } from '@material-ui/core'

const TextProperty = props => {
  const { properties } = props
  const property = () => (properties[props.property] || '').toString()
  const [value, setValue] = React.useState(property())

  const commit = () => {
    const cleanValue = value.toString().trim()
    properties[props.property] = cleanValue
    setValue(cleanValue)
    props.onCommit(properties)
  }

  const handleKeyDown = event => {
    switch (event.key) {
      case 'Escape': return setValue(property())
      case 'Enter': return commit()
    }
  }

  return (
    <TextField
      className={props.className}
      label={props.label}
      value={value}
      onChange={({ target }) => setValue(target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commit}
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

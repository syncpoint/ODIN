import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Select, MenuItem } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  secondColumn: { gridColumn: 2, height: 'min-content' }
}))

const OperationalStatusProperty = props => {
  const { status, onChange } = props
  const classes = useStyles()

  const select = () => status === 'A'
    ? <Select
      className={ classes.secondColumn }
      label={'Status'}
      value={''}
      disabled={true}
    />
    : <Select
      className={ classes.secondColumn }
      label={'Status'}
      value={status}
      onChange={onChange}
    >
      <MenuItem value={'P'}>N/A</MenuItem>
      <MenuItem value={'C'}>Fully Capable</MenuItem>
      <MenuItem value={'D'}>Damaged</MenuItem>
      <MenuItem value={'X'}>Destroyed</MenuItem>
      <MenuItem value={'F'}>Full to Capacity</MenuItem>
    </Select>

  return select()
}

OperationalStatusProperty.propTypes = {
  status: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default OperationalStatusProperty

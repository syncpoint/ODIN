import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputBase } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  search: {
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    fontSize: '120%',

    // prevent placeholder from highlighting on select-all
    userSelect: 'none'
  }
}))

const Search = props => {
  const classes = useStyles()

  const handleKeyDown = event => {
    switch (event.key) {
      case 'Escape': return props.onChange('')
    }
  }

  return (
    <InputBase
      className={classes.search}
      placeholder={'Search...'}
      autoFocus
      value={props.value}
      onChange={({ target }) => props.onChange(target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}

Search.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default Search

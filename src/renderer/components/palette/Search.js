import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputBase } from '@material-ui/core'
import { useTranslation } from 'react-i18next'

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

const Search = ({ initialValue, onChange }) => {
  const classes = useStyles()
  const { t } = useTranslation()
  const handleChange = ({ target }) => onChange(target.value)

  const handleKeyDown = event => {
    switch (event.key) {
      case 'Escape': return onChange('')
    }
  }

  return (
    <InputBase
      className={classes.search}
      placeholder={t('palette.search.placeholder')}
      autoFocus
      value={initialValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}

Search.propTypes = {
  initialValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  delay: PropTypes.number
}

export default Search

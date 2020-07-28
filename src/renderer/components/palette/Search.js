import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputBase } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import debounce from 'lodash.debounce'

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
  const { t } = useTranslation()
  const handleKeyDown = event => {
    switch (event.key) {
      case 'Escape': return props.onChange('')
    }
  }

  const notifyParent = debounce(() => props.onChange(value), 400)

  const [value, setValue] = React.useState(props.value)
  React.useEffect(() => {
    notifyParent()
  }, [value])

  return (
    <InputBase
      className={classes.search}
      placeholder={t('palette.search.placeholder')}
      autoFocus
      value={value}
      onChange={({ target }) => setValue(target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}

Search.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default Search

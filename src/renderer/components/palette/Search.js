import React from 'react'
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

export const Search = (/* props */) => {
  const classes = useStyles()

  // TODO: find way to prevent select-all highlighting when field has no focus

  return (
    <InputBase
      className={classes.search}
      placeholder={'Search...'}
      autoFocus
      disabled
    />
  )
}

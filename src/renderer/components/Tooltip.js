import React from 'react'
import Tooltip from '@material-ui/core/Tooltip'
import Fade from '@material-ui/core/Fade'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  tooltip: {
    userSelect: 'none'
  }
}))

export default (prop) => {
  const { title, placement } = prop
  const classes = useStyles()
  return (
    <Tooltip
      classes={{ tooltip: classes.tooltip }}
      placement={placement}
      title={title}
      enterDelay={1200}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 600 }}>
      {prop.children}
    </Tooltip>
  )
}



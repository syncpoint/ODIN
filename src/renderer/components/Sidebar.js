import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { Tooltip } from '@material-ui/core'
import Icon from '@material-ui/icons/PermMedia'

const Sidebar = props => {
  const { classes, clickAction } = props

  return (
    <div className={classes.sidebar}>
      <Tooltip title='Manage Projects' arrow>
        <Icon onClick={clickAction}/>
      </Tooltip>
    </div>
  )
}

Sidebar.propTypes = {
  classes: PropTypes.object,
  clickAction: PropTypes.func
}

const styles = {
  sidebar: {
    position: 'fixed',
    display: 'grid',
    gridTemplateColumns: '3em',
    gridTemplateRows: 'auto',
    top: '1em',
    left: '0.5em',
    zIndex: 21
  }
}

export default withStyles(styles)(Sidebar)

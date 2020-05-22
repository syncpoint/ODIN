import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import Divider from '@material-ui/core/Divider'
import Tooltip from './Tooltip.js'

const useStyles = makeStyles((theme) => ({
  activityBar: {
    gridArea: 'A',
    pointerEvents: 'auto'
  },
  listItem: {
    paddingLeft: 13, // assumimg thick border is 5px (8px + 5px)
    paddingRight: 8
  },
  'listItem:selected': {
    paddingLeft: 8,
    paddingRight: 8,
    borderLeft: `${theme.palette.primary.light} solid thick`
  }
}))


const ActivityBar = props => {
  const { activities, activeTool, onActivitySelected } = props
  const classes = useStyles()

  const activityItem = (activity, index) => {
    const selected = activity && activity.id ? (activeTool && activeTool.id === activity.id) : false

    return (
      // ListItem has 16px default left/right padding by default
      <ListItem
        classes={{
          root: classes.listItem,
          selected: classes['listItem:selected']
        }}
        key={index}
        onClick={() => onActivitySelected(activity)}
        selected={selected}
        button
      >
        <Tooltip title={activity.tooltip} >
          <ListItemIcon>
            {activity.icon}
          </ListItemIcon>
        </Tooltip>
      </ListItem>
    )
  }

  const actionItem = (activity, index) =>
    <ListItem
      className={classes.listItem}
      key={index}
      onClick={activity.action}
      button
    >
      <Tooltip title={activity.tooltip} >
        <ListItemIcon>
          {activity.icon}
        </ListItemIcon>
      </Tooltip>
    </ListItem>

  const listItem = (activity, index) => {
    switch (activity.type) {
      case 'activity': return activityItem(activity, index)
      case 'divider': return <Divider key={index}/>
      case 'action': return actionItem(activity, index)
    }
  }

  return (
    <Paper className={classes.activityBar} elevation={6}>
      <List>
        { activities.map(listItem) }
      </List>
    </Paper>
  )
}

ActivityBar.propTypes = {
  activities: PropTypes.array.isRequired,
  activeTool: PropTypes.object,
  onActivitySelected: PropTypes.func.isRequired
}

export default ActivityBar

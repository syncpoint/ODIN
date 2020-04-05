import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import Divider from '@material-ui/core/Divider'

const useStyles = makeStyles((theme) => ({
  activityBar: {
    gridArea: 'A',
    pointerEvents: 'auto'
  },
  icon: {
    color: 'lightgray'
  },
  selectedIcon: {
    color: 'black'
  }
}))


const ActivityBar = props => {
  const { activities, onActivitySelected } = props
  const classes = useStyles()

  const activityItem = (activity, index) => {
    const iconClass = activity.selected ? classes.selectedIcon : classes.icon
    return (
      // ListItem has 16px left/right padding by default
      <ListItem
        key={index}
        onClick={() => onActivitySelected(activity.id)}
        button
      >
        <ListItemIcon className={iconClass}>
          {activity.icon}
        </ListItemIcon>
      </ListItem>
    )
  }

  const actionItem = (activity, index) => {
    return (
      <ListItem
        key={index}
        onClick={activity.action}
        button
      >
        <ListItemIcon>
          {activity.icon}
        </ListItemIcon>
      </ListItem>
    )
  }

  const listItem = (activity, index) => {
    switch (activity.type) {
      case 'activity': return activityItem(activity, index)
      case 'divider': return <Divider key={index}/>
      case 'action': return actionItem(activity, index)
    }
  }

  return <Paper className={classes.activityBar} elevation={6}>
    <List>
      {
        activities.map(listItem)
      }
    </List>
  </Paper>
}

ActivityBar.propTypes = {
  activities: PropTypes.array.isRequired,
  onActivitySelected: PropTypes.func.isRequired
}

export default ActivityBar

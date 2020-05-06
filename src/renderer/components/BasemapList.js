import React from 'react'
import { makeStyles } from '@material-ui/core/styles'

import { ListItem, List, Paper, Typography } from '@material-ui/core'

import { listSourceDescriptors } from '../map/basemap'
import preferences from '../project/preferences'

const useStyles = makeStyles(theme => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  listContainer: {
    height: '100%',
    overflow: 'auto'
  }
}))


const BasemapList = props => {
  const classes = useStyles()

  const [sourceDescriptors, setSourceDescriptors] = React.useState([])

  React.useEffect(() => {
    const loadBasemaps = async () => {
      const descriptors = await listSourceDescriptors()
      setSourceDescriptors(descriptors)
    }
    loadBasemaps()
  }, [])

  /*  The selcted descriptor is written to the project preferences */
  const handleDescriptorSelected = descriptor => {
    preferences.set('basemap', descriptor)
  }

  return (
    <Paper className={classes.panel} elevation={6}>
      <div className={classes.listContainer}>
        <List>
          {
            sourceDescriptors.map(descriptor => (
              <ListItem key={descriptor.id} button
                onClick={event => handleDescriptorSelected(descriptor)}
              >
                <Typography variant="button">{descriptor.name}</Typography>
              </ListItem>
            ))
          }
        </List>
      </div>
    </Paper>
  )
}

export default BasemapList

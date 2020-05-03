import React from 'react'
import PropTypes from 'prop-types'
import {
  List, ListItem,
  ListItemText, ListItemSecondaryAction,
  IconButton
} from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'

import { ipcRenderer } from 'electron'

const SourceDescriptorList = props => {
  const [sourceDescriptors, setSourceDescriptors] = React.useState(null)
  const [reloadDescriptors, setReloadDescriptors] = React.useState(true)
  const [selected, setSelected] = React.useState(null)

  React.useEffect(() => {
    if (!reloadDescriptors) return
    const loadSourceDescriptors = async () => {
      setSourceDescriptors(await ipcRenderer.invoke('IPC_LIST_SOURCE_DESCRIPTORS'))
      setReloadDescriptors(false)
    }
    loadSourceDescriptors()
  }, [reloadDescriptors])

  /* when a descriptor gets persisted we need to force the list to reload */
  React.useEffect(() => {
    setReloadDescriptors(props.forceReload)
  })

  React.useEffect(() => {
    if (!sourceDescriptors || sourceDescriptors.lenght === 0) return
    handleSelected(sourceDescriptors[0])
  }, [sourceDescriptors])

  const handleSelected = descriptor => {
    setSelected(descriptor)
    props.onDescriptorSelected(descriptor)
  }

  return (
    <List>
      { sourceDescriptors ? sourceDescriptors.map(descriptor => (
        <ListItem key={descriptor.name} button
          selected={selected && selected.id === descriptor.id}
          onClick={() => handleSelected(descriptor)}>
          <ListItemText primary={descriptor.name} />
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={() => props.onDescriptorEdited(descriptor)}>
              <EditIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )) : null
      }
    </List>
  )
}
SourceDescriptorList.propTypes = {
  onDescriptorSelected: PropTypes.func,
  onDescriptorEdited: PropTypes.func,
  forceReload: PropTypes.bool
}

export default SourceDescriptorList

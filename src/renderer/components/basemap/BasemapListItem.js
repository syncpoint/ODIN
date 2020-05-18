import React from 'react'
import PropTypes from 'prop-types'
import { useDrag, useDrop } from 'react-dnd'
import ItemTypes from './DnDItemTypes'

import VisibilityIcon from '@material-ui/icons/Visibility'
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff'
import DragHandle from '@material-ui/icons/DragHandle'

import { makeStyles } from '@material-ui/core/styles'
import { ListItem, ListItemSecondaryAction, Typography, IconButton } from '@material-ui/core'

const useStyle = makeStyles(theme => ({
  listItem: {
    margin: theme.spacing(0.25),
    border: '1px solid #cccccc',
    borderRadius: '2px',
    padding: theme.spacing(1)
  },
  actions: {
    float: 'right'
  }
}))


const BasemapListItem = ({ id, text, index, visible, moveBasemapItem, visibilityClicked }) => {
  const classes = useStyle()
  const ref = React.useRef(null)

  const [, drop] = useDrop({
    accept: ItemTypes.ODIN_BASEMAP_LISTITEM,
    hover (item, monitor) {
      if (!ref.current) return

      const dragIndex = item.index
      const hoverIndex = index

      /* do not replace item with itself */
      if (dragIndex === hoverIndex) return

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect()
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      // Time to actually perform the action
      moveBasemapItem(dragIndex, hoverIndex)
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    }
  })

  const [{ isDragging }, drag] = useDrag({
    item: {
      type: ItemTypes.ODIN_BASEMAP_LISTITEM,
      id,
      index
    },

    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const opacity = isDragging ? 0 : 1

  drag(drop(ref))

  return (
    <ListItem ref={ref} className={classes.listItem} style={{ opacity }}>
      <DragHandle color={visible ? 'initial' : 'disabled'}/>
      <Typography variant="button" color={visible ? 'initial' : 'textSecondary'}>{text}</Typography>
      <ListItemSecondaryAction>
        <IconButton size="small" onClick={() => visibilityClicked(id)}>
          { visible ? <VisibilityIcon /> : <VisibilityOffIcon /> }
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

BasemapListItem.propTypes = {
  id: PropTypes.string,
  text: PropTypes.string,
  index: PropTypes.number,
  moveBasemapItem: PropTypes.func,
  visibilityClicked: PropTypes.func
}

export default BasemapListItem

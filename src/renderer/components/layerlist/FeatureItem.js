import React from 'react'
import PropTypes from 'prop-types'
import { Badge, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import LinkIcon from '@material-ui/icons/LinkOutlined'

import selection from '../../selection'

export const FeatureItem = props => {

  const { name, references } = props

  const handleClick = id => () => {
    selection.deselect()
    selection.select([id])
  }

  return (
    <ListItem
      selected={props.selected}
      onClick={handleClick(props.id)}
      button
    >

      <ListItemText >{ name } </ListItemText>
      { (references.length > 0) && (
        <ListItemSecondaryAction>
          <Badge badgeContent={references.length} color='primary'>
            <LinkIcon />
          </Badge>
        </ListItemSecondaryAction>
      )
      }
    </ListItem>
  )
}

FeatureItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  references: PropTypes.array,
  selected: PropTypes.bool // optional, false if omitted
}

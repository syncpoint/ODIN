import React from 'react'
import PropTypes from 'prop-types'
import { Badge, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import LinkIcon from '@material-ui/icons/LinkOutlined'

import selection from '../../selection'

export const FeatureItem = props => {
  const handleClick = id => () => {
    selection.deselect()
    selection.select([id])
  }

  const showIcon = length => length > 21

  return (
    <ListItem
      selected={props.selected}
      onClick={handleClick(props.id)}
      button
    >

      <ListItemText >{ props.name } </ListItemText>
      { showIcon(props.name.length) && (
        <ListItemSecondaryAction>
          <Badge badgeContent={4} color='primary'>
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
  selected: PropTypes.bool // optional, false if omitted
}

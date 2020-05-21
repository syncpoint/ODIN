import React from 'react'
import PropTypes from 'prop-types'
import ListItem from '@material-ui/core/ListItem'
import selection from '../../selection'

export const FeatureItem = props => {
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
      { props.name }
    </ListItem>
  )
}

FeatureItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  selected: PropTypes.bool // optional, false if omitted
}

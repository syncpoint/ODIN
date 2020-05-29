import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import Avatar from '@material-ui/core/Avatar'
import ListItemText from '@material-ui/core/ListItemText'
import ms from 'milsymbol'

const useStyles = makeStyles((/* theme */) => ({
  root: {
    paddingLeft: '8px'
  }
}))


const placeholderSymbol = new ms.Symbol('')

const FeatureItem = props => {
  const classes = useStyles()
  const symbol = new ms.Symbol(props.sidc)
  const extended = false
  const url = symbol.isValid(extended)
    ? symbol.asCanvas().toDataURL()
    : placeholderSymbol.asCanvas().toDataURL()

  return (
    <ListItem
      className={classes.root}
      alignItems="flex-start"
      button
      key={props.sortkey}
      onClick={props.onClick}
    >
      <ListItemAvatar style={{ width: '10%' }}>
        <Avatar
          src={url}
          style={{
            borderRadius: 0,
            marginRight: 8,
            width: 'auto',
            height: 'auto'
          }}
        />
      </ListItemAvatar>
      <ListItemText
        primary={props.name}
        secondary={props.hierarchy}
      />
    </ListItem>
  )
}

FeatureItem.propTypes = {
  sortkey: PropTypes.string.isRequired,
  sidc: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  hierarchy: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}


export default FeatureItem

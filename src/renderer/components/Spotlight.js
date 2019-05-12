import React from 'react'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import L from 'leaflet'
import search from './nominatim'

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)',
  },
  searchField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  list: {
    overflow: 'scroll',
    maxHeight: 'fill-available',
    flexGrow: 1
  }
})

class Spotlight extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      rows: []
    }
  }

  updateResultList(searchResult) {
    // TODO: order results by euclidean distance to current map center
    const rows = searchResult.map(row => ({
      key: row.place_id,
      name: row.display_name,
      type: row.type,
      box: row.boundingbox,
      lat: row.lat,
      lon: row.lon
    }))

    this.setState({...this.state, rows})
  }

  handleKeyPress(event) {
    const searchOptions = {
      // limit: 7,
      addressdetails: 1,
      namedetails: 0
      // TODO: supply filter
      // TODO: supply sorter
    }

    switch(event.key) {
      case 'Enter': {
        search(searchOptions)(event.target.value)
          .then(searchResult => this.updateResultList(searchResult))
        break
      }
      default:
        break
    }
  }

  handleSelect(key) {
    // TODO: drop dependency to Leaflet (L.latLng())
    this.state.rows
      .filter(row => row.key === key)
      .forEach(row => this.props.onMoveTo(L.latLng(row.lat, row.lon)))
  }

  render() {
    const { classes } = this.props

    const rows = () => (this.state.rows || []).map(row => (
      <ListItem
        button
        divider={ true }
        key={ row.key }
        onClick={ () => this.handleSelect(row.key) }
      >
        <ListItemText
          primary={ row.name }
          secondary={ row.type }
        />
      </ListItem>
    ))

    return (
      <Paper
        className={ classes.root }
        elevation={ 4 }
      >
        <TextField
          id="standard-search"
          label="Search place or address"
          type="search"
          className={ classes.searchField }
          margin="normal"
          variant="outlined"
          onKeyPress={ event => this.handleKeyPress(event) }
        />
        <List dense={ true } className={ classes.list }>{ rows() }</List>
      </Paper>
    )
  }
}

export default withStyles(styles)(Spotlight)
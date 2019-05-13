import React from 'react'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'
import SearchField from './SearchField'
import ResultList from './ResultList'


/**
 * TODO: design interface (filter mode and search mode, input mode)
 * - Events: close, focus, select, input
 * - Functions: search, filter
 * - Factories: listItem, preview
 */
class Spotlight extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      rows: []
    }
  }

  handleUpdate(xs) {
    // TODO: order results by euclidean distance to current map center
    const rows = xs.map(row => ({
      key: row.place_id,
      name: row.display_name,
      type: row.type,
      box: row.boundingbox,
      lat: row.lat,
      lon: row.lon
    }))

    this.setState({...this.state, rows})
  }

  render() {
    const { classes } = this.props

    return (
      <Paper
        className={ classes.paper }
        elevation={ 4 }
      >
        <SearchField
          search={ this.props.search }
          onUpdate={ xs => this.handleUpdate(xs) }
        />
        <ResultList
          rows={ this.state.rows }
          onSelect={ this.props.onSelect }
          onClose={ this.props.onClose }
        />
        {/* <Preview></Preview> */}
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)'
  }
})

export default withStyles(styles)(Spotlight)
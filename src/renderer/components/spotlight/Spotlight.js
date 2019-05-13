import React from 'react'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'
import SearchField from './SearchField'
import ResultList from './ResultList'


class Spotlight extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      rows: []
    }
  }

  handleUpdate(rows) {
    this.setState({
      ...this.state,
      rows: rows.map(this.props.options.mapRow),
    })
  }

  render() {
    const { classes } = this.props

    return (
      <Paper
        className={ classes.paper }
        elevation={ 4 }
      >
        <SearchField
          options={ this.props.options }
          onUpdate={ rows => this.handleUpdate(rows) }
        />
        <ResultList
          rows={ this.state.rows }
          options={ this.props.options }
          onUpdate={ rows => this.handleUpdate(rows) }
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
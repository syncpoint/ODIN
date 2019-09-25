/* eslint-disable */
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { currentDateTime } from '../../shared/datetime'
import evented from '../evented'
import settings from '../model/settings'
import { ipcRenderer } from 'electron'

class OSD extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      // OSD visible at all (except temporary message in B1):
      osdVisible: settings.osd.visible(),

      // List octive slots:
      osdOptions: settings.osd.options(),
      'C1': currentDateTime()
    }
  }

  componentDidMount () {
    // Start timer for Date/Time display:
    setInterval(() => {
      evented.emit('OSD_MESSAGE', { 'message': currentDateTime(), slot: 'C1' })
    }, 1000)

    this.handleOSDMessage = ({ message, duration, slot = 'B1' }) => {
      if (!this.state.osdVisible) return
      if (this.state[slot] === message) return

      const updateSlot = message => {
        const state = {}
        state[slot] = message
        this.setState(state)
      }

      updateSlot(message)
      if (duration) setTimeout(() => updateSlot(''), duration)
    }

    evented.on('OSD_MESSAGE', this.handleOSDMessage)
    evented.emit('OSD_MOUNTED')

    ipcRenderer.on('COMMAND_TOGGLE_OSD_OPTIONS', (_, slot) => {
      const osdOptions = this.state.osdOptions.indexOf(slot) === -1
        ? this.state.osdOptions.concat(slot)
        : this.state.osdOptions.filter(x => x !== slot)

      settings.osd.setOptions(osdOptions)
      this.setState({ osdOptions })
    })

    ipcRenderer.on('COMMAND_TOGGLE_OSD', () => {
      this.setState({ osdVisible: !this.state.osdVisible })
    })
  }

  shouldComponentUpdate (_, state) {
    return !R.equals(this.state, state)
  }

  componentWillUnmount () {
    evented.removeListener('OSD_MESSAGE', this.handleOSDMessage)
  }

  render () {
    const { classes } = this.props
    const { osdVisible, osdOptions } = this.state

    const value = key => {
      if (key !== 'B1' && !osdVisible) return ''
      if (osdOptions.indexOf(key) === -1) return ''
      return this.state[key]
    }

    const slots = ['1', '2', '3'].reduce((acc, row) => {
      return ['A', 'B', 'C'].reduce((acc, column) => {
        const key = `${column}${row}`
        return acc.concat(
          <div key={ key } className={ classes[`osd${key}`] }>{ value(key) }</div>
        )
      }, acc)
    }, [])

    return <div className={ classes.osdPanel }>{ slots }</div>
  }
}

OSD.propTypes = {
  classes: PropTypes.any.isRequired
}

// OSD slots: Prepare styles for 3 columns x 3 rows.
const osdSlots = () => {
  const columns = {
    'A': { justifySelf: 'start' },
    'B': { justifySelf: 'center' },
    'C': { justifySelf: 'end' }
  }

  return ['1', '2', '3'].reduce((acc, name) => {
    return Object.entries(columns).reduce((acc, [key, value]) => {
      acc[`osd${key}${name}`] = {
        gridArea: `${key}${name}`,
        justifySelf: value.justifySelf,
        background: 'rgba(250, 250, 250, 0.9)'
      }
      return acc
    }, acc)
  }, {})
}

const styles = Object.assign({
  osdPanel: {
    color: '#333',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: '300', // bolder, lighter
    lineHeight: 1.6,
    userSelect: 'none',
    gridRowStart: 1,
    gridColumnStart: 1,
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
    gridTemplateAreas: `
      "A1 B1 C1"
      "A2 B2 C2"
      "A3 B3 C3"
    `
  }
}, osdSlots())

export default withStyles(styles)(OSD)

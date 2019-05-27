import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { currentDateTime } from '../../shared/datetime'
import evented from '../evented'
import mapSettings from './map/settings'
import { ipcRenderer } from 'electron'

class OSD extends React.Component {
  constructor (props) {
    super(props)
    this.osdOptions = mapSettings.get('osd-options') ||
    ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']
    this.state = {
      'C1': this.osdOptions.includes('C1') ? currentDateTime() : ''
    }
    this.restore = {}
  }

  handleOSDMessage ({ message, duration, slot }) {
    slot = slot || 'B1'
    const update = Object.assign({}, this.state)
    this.restore[slot] = message
    update[slot] = this.osdOptions.includes(slot) ? message : ''
    this.setState(update)
    if (!duration) return

    setTimeout(() => {
      const update = Object.assign({}, this.state)
      update[slot] = ''
      this.setState(update)
    }, duration)
  }

  componentDidMount () {
    this.clockInterval = setInterval(() => {
      this.handleOSDMessage({ 'message': currentDateTime(), slot: 'C1' })
    }, 1000)

    evented.on('OSD_MESSAGE', this.handleOSDMessage.bind(this))
    evented.emit('OSD_MOUNTED')

    ipcRenderer.on('COMMAND_TOGGLE_OSD_OPTIONS', (_, args) => {
      this.osdOptions.includes(args)
        ? this.osdOptions.splice(this.osdOptions.lastIndexOf(args), 1)
        : this.osdOptions.push(args)
      mapSettings.set('osd-options', this.osdOptions)
      this.handleOSDMessage({ 'message': this.restore[args], 'slot': args })
    })
  }

  componentWillUnmount () {
    evented.removeListener('OSD_MESSAGE', this.handleOSDMessage)
  }

  render () {
    const { classes } = this.props

    const slots = ['1', '2', '3'].reduce((acc, row) => {
      return ['A', 'B', 'C'].reduce((acc, column) => {
        const key = `${column}${row}`
        return acc.concat(
          <div key={ key } className={ classes[`osd${key}`] }>{ this.state[key] }</div>
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

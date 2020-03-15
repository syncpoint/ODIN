import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import getCurrentDateTime from '../../shared/militaryTime'
import evented from '../evented'


const OSD = (props) => {
  const { classes } = props
  const [state, setState] = useState({ A1: 'ODIN - C2IS' })

  const handleOSDMessage = ({ message, duration, slot = 'B1' }) => {
    if (state[slot] === message) return
    const updateSlot = message => {
      const newState = { ...state }
      newState[slot] = message
      setState(newState)
    }

    updateSlot(message)
    if (duration) setTimeout(() => updateSlot(''), duration)
  }

  useEffect(() => {
    evented.on('OSD_MESSAGE', handleOSDMessage)
    return () => evented.removeListener('OSD_MESSAGE', handleOSDMessage)
  })

  useEffect(() => {
    const updateTime = () => evented.emit('OSD_MESSAGE', { message: getCurrentDateTime(), slot: 'C1' })
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const valueOf = slot => state[slot] ? state[slot] : ''

  const slots = ['1', '2', '3'].reduce((acc, row) => {
    return ['A', 'B', 'C'].reduce((acc, column) => {
      const key = `${column}${row}`
      return acc.concat(
        <div key={ key } className={ classes[`osd${key}`] }>{ valueOf(key) }</div>
      )
    }, acc)
  }, [])
  return <div className={ classes.osdPanel }>{slots}</div>
}

OSD.propTypes = {
  classes: PropTypes.any.isRequired
}

// OSD slots: Prepare styles for 3 columns x 3 rows.
const osdSlots = () => {
  const columns = {
    A: { justifySelf: 'start' },
    B: { justifySelf: 'center' },
    C: { justifySelf: 'end' }
  }

  return ['1', '2', '3'].reduce((acc, name) => {
    return Object.entries(columns).reduce((acc, [key, value]) => {
      acc[`osd${key}${name}`] = {
        gridArea: `${key}${name}`,
        justifySelf: value.justifySelf,
        background: 'rgba(250, 250, 250, 0.85)'
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
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
    gridTemplateAreas: `
      "A1 B1 C1"
      "A2 B2 C2"
      "A3 B3 C3"
    `
  }
}, osdSlots())

export default withStyles(styles)(OSD)

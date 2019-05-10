import React from 'react'
import { withStyles } from '@material-ui/core/styles'

// Prepare 3 x 3 OSD slot styles.
const osdSlots = () => {
  const columns = {
    "A": { justifySelf: 'start' },
    "B": { justifySelf: 'center' },
    "C": { justifySelf: 'end' }
  }

  return ['1', '2', '3'].reduce((acc, name) => {
    return Object.entries(columns).reduce((acc, [key, value]) => {
      acc[`osd${key}${name}`] = {
        gridArea: `${key}${name}`,
        justifySelf: value.justifySelf,
        background: 'rgba(250, 250, 250, 0.6)'
      }
      return acc
    }, acc)
  }, {})
}

const styles = Object.assign({
  osdPanel: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: '120%',
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


const OSD = props => {
  const slots = ['1', '2', '3'].reduce((acc, row) => {
    return ['A', 'B', 'C'].reduce((acc, column) => {
      const key = `${column}${row}`
      return acc.concat(
        <div key={ key } className={ props.classes[`osd${key}`] }>{ props.osd[key] }</div>
      )
    }, acc)
  }, [])

  return <div className={ props.classes.osdPanel }>{ slots }</div>
}

export default withStyles(styles)(OSD)
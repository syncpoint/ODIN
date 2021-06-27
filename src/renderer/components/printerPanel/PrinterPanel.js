import React from 'react'
import { Button, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import PaperFormat from './PaperFormat'
import Scale from './Scale'

import evented from '../../evented'


const useStyles = makeStyles((/* theme */) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column'
  }
}))

const PrinterPanel = props => {
  const classes = useStyles()

  const [paperFormat, setPaperFormat] = React.useState('a4')
  const [scale, setScale] = React.useState('25')

  React.useEffect(() => {
    evented.emit('PRINT_SHOW_AREA', { paperFormat, scale })
    return () => evented.emit('PRINT_HIDE_AREA')
  }, [paperFormat, scale])


  return (
    <Paper elevation={6} className={classes.panel}>
      <PaperFormat paperFormat={paperFormat} onChange={setPaperFormat} />
      <Scale scale={scale} onChange={setScale} />
      <Button variant="contained" color="primary" onClick={() => evented.emit('PRINT_EXECUTE', { paperFormat, scale })}>Print</Button>
    </Paper>
  )
}

export default PrinterPanel

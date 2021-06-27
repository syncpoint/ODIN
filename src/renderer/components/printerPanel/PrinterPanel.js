import React from 'react'
import { Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import PaperFormat from './PaperFormat'
import Scale from './Scale'

import evented from '../../evented'


const useStyles = makeStyles((/* theme */) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    fontFamily: 'Roboto',
    display: 'flex',
    flexDirection: 'column'
  }
}))

const PrinterPanel = props => {
  const classes = useStyles()

  const [paperFormat, setPaperFormat] = React.useState('a4')
  const [scale, setScale] = React.useState('50')

  React.useEffect(() => {
    evented.emit('PRINT_SHOW_AREA', { paperFormat, scale })
    return () => evented.emit('PRINT_HIDE_AREA')
  }, [paperFormat, scale])


  return (
    <Paper elevation={6} className={classes.panel}>
      <PaperFormat paperFormat={paperFormat} onChange={setPaperFormat} />
      <Scale scale={scale} onChange={setScale} />
    </Paper>
  )
}

export default PrinterPanel

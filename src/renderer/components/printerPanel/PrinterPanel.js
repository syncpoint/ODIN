import React from 'react'
import { Button, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import PaperFormat from './PaperFormat'
import Scale from './Scale'
import Quality from './Quality'

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
  const [quality, setQuality] = React.useState('medium')
  const [targetOutputFormat, setTargetOutputFormat] = React.useState('PDF')

  const [isPrinting, setIsPrinting] = React.useState(false)

  React.useEffect(() => {
    evented.emit('PRINT_SHOW_AREA', { paperFormat, scale, quality })
    return () => evented.emit('PRINT_HIDE_AREA')
  }, [paperFormat, scale])

  React.useEffect(() => {
    const onPrintExecutionDone = function () {
      setIsPrinting(false)
    }
    evented.on('PRINT_EXECUTION_DONE', onPrintExecutionDone)
    return () => evented.off('PRINT_EXECUTION_DONE', onPrintExecutionDone)
  }, [])

  const executePrint = () => {
    setIsPrinting(true)
    evented.emit('PRINT_EXECUTE', { paperFormat, scale, quality, targetOutputFormat })
  }

  return (
    <Paper elevation={6} className={classes.panel}>
      <PaperFormat paperFormat={paperFormat} disabled={isPrinting} onChange={setPaperFormat} />
      <Scale scale={scale} onChange={setScale} disabled={isPrinting} />
      <Quality quality={quality} disabled={isPrinting} onChange={setQuality} />
      <Button variant="contained" color="primary" style={{ margin: '1em' }} disabled={isPrinting} onClick={executePrint}>Create { targetOutputFormat }</Button>
    </Paper>
  )
}

export default PrinterPanel

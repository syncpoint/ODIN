import React from 'react'
import { Button, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import PaperFormat from './PaperFormat'
import Scale from './Scale'
import Quality from './Quality'
import OutputFormat from './OutputFormat'

import evented from '../../evented'
import preferences from '../../project/preferences'


const useStyles = makeStyles((/* theme */) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  printAnchor: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  printArea: {
    visibility: 'hidden',
    borderWidth: '3px 3px 3px 3px',
    borderColor: 'yellowgreen',
    borderStyle: 'solid',
    pointerEvents: 'none',
    backdropFilter: 'brightness(1.125)',
    marginLeft: '20%',
    zIndex: 19
  }
}))

const DEFAULTS = {
  paperFormat: 'a4',
  scale: 25,
  quality: 'medium',
  targetOutputFormat: 'PDF'
}

const PrinterPanel = props => {
  const classes = useStyles()

  const [paperFormat, setPaperFormat] = React.useState(DEFAULTS.paperFormat)
  const [scale, setScale] = React.useState(DEFAULTS.scale)
  const [quality, setQuality] = React.useState(DEFAULTS.quality)
  const [targetOutputFormat, setTargetOutputFormat] = React.useState(DEFAULTS.targetOutputFormat)

  const [isPrinting, setIsPrinting] = React.useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = React.useState(false)

  React.useEffect(() => {
    // should only run AFTER the initial setting
    if (!preferencesLoaded) return
    const printPreferences = {
      paperFormat,
      scale,
      quality,
      targetOutputFormat
    }
    preferences.set('print', printPreferences)
  }, [paperFormat, scale, quality, targetOutputFormat])

  React.useEffect(() => {
    const handler = ({ type, preferences }) => {
      if (type !== 'preferences') return
      setPaperFormat(preferences.print.paperFormat || DEFAULTS.paperFormat)
      setScale(preferences.print.scale || DEFAULTS.scale)
      setQuality(preferences.print.quality || DEFAULTS.quality)
      setTargetOutputFormat(preferences.print.targetOutputFormat || DEFAULTS.targetOutputFormat)
      setPreferencesLoaded(true)
    }
    preferences.register(handler)
    return () => preferences.deregister(handler)
  }, [])

  React.useEffect(() => {
    evented.emit('PRINT_SHOW_AREA', { paperFormat, scale, quality })
    return () => evented.emit('PRINT_HIDE_AREA')
  }, [paperFormat, scale, quality])

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
    <>
      <Paper elevation={6} className={classes.panel}>
        <PaperFormat paperFormat={paperFormat} disabled={isPrinting} onChange={setPaperFormat} />
        <Scale scale={scale} onChange={setScale} disabled={isPrinting} />
        <Quality quality={quality} disabled={isPrinting} onChange={setQuality} />
        <OutputFormat targetOutputFormat={targetOutputFormat} disabled={isPrinting} onChange={setTargetOutputFormat} />
        <Button variant="contained" color="primary" style={{ margin: '1em' }} disabled={isPrinting} onClick={executePrint}>Create { targetOutputFormat }</Button>
      </Paper>
      <div className={classes.printAnchor}>
        <div className={classes.printArea} id='printArea' />
      </div>
    </>
  )
}

export default PrinterPanel

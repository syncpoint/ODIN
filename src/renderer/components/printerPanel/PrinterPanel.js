import React from 'react'
import { Backdrop, Button, CircularProgress, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import PaperFormat from './PaperFormat'
import Orientation from './Orientation'
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
    zIndex: -1,
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
    marginLeft: '20%'
  },
  backdrop: {
    zIndex: -1,
    backdropFilter: 'blur(25px)'
  }
}))

const DEFAULTS = {
  paperFormat: 'a4',
  orientation: 'landscape',
  scale: 25,
  quality: 'medium',
  targetOutputFormat: 'PDF'
}

const PrinterPanel = props => {
  const classes = useStyles()

  const [paperFormat, setPaperFormat] = React.useState(DEFAULTS.paperFormat)
  const [orientation, setOrientation] = React.useState(DEFAULTS.orientation)
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
      orientation,
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
      setOrientation(preferences.print.orientation || DEFAULTS.orientation)
      setPreferencesLoaded(true)
    }
    preferences.register(handler)
    return () => preferences.deregister(handler)
  }, [])

  React.useEffect(() => {
    evented.emit('PRINT_SHOW_AREA', { paperFormat, orientation, scale, quality })
    return () => evented.emit('PRINT_HIDE_AREA')
  }, [paperFormat, scale, quality])

  React.useEffect(() => {
    const onPrintExecutionDone = () => {
      setIsPrinting(false)
    }
    evented.on('PRINT_EXECUTION_DONE', onPrintExecutionDone)
    return () => evented.off('PRINT_EXECUTION_DONE', onPrintExecutionDone)
  }, [])

  const executePrint = () => {
    setIsPrinting(true)
    evented.emit('PRINT_EXECUTE', { paperFormat, orientation, scale, quality, targetOutputFormat })
  }

  return (
    <>
      <Paper elevation={6} className={classes.panel}>
        <PaperFormat paperFormat={paperFormat} disabled={isPrinting} onChange={setPaperFormat} />
        <Orientation orientation={orientation} disabled={isPrinting} onChange={setOrientation} />
        <Scale scale={scale} onChange={setScale} disabled={isPrinting} />
        <Quality quality={quality} disabled={isPrinting} onChange={setQuality} />
        <OutputFormat targetOutputFormat={targetOutputFormat} disabled={isPrinting} onChange={setTargetOutputFormat} />
        <Button variant="contained" color="primary" style={{ margin: '1em' }} disabled={isPrinting} onClick={executePrint}>Create { targetOutputFormat }</Button>
      </Paper>
      <div className={classes.printAnchor}>
        <div className={classes.printArea} id='printArea' />
        <Backdrop className={classes.backdrop} open={isPrinting} >
          <CircularProgress color='secondary' size='10vh' thickness={6} />
        </Backdrop>
      </div>
    </>
  )
}

export default PrinterPanel

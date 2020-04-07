/* eslint-disable */
import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Paper from '@material-ui/core/Paper'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from './Tooltip.js'

import {
  LockOutline,
  LockOpenVariantOutline,
  LockOpen,
  LockOpenVariant,
  Lock,
  EyeOutline,
  EyeOffOutline,
  Eye,
  EyeOff,
  LayersMinus,
  LayersPlus,
  ExportVariant,
  ContentDuplicate
} from 'mdi-material-ui'

const useStyles = makeStyles((theme) => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto'
  },

  buttonGroup: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'flex-end'
  },

  item: {
    display: 'grid',
    gridGap: '10px',
    gridTemplateColumns: 'auto auto',
    gridTemplateAreas: '"L R"',
    padding: '8px 8px', // top/bottom left/right
    // borderBottom: '1px solid #cccccc',
    fontFamily: 'Roboto'
  },

  itemLeft: {
    gridArea: 'L',
    alignSelf: 'center'
  },

  itemRight: {
    gridArea: 'R',
    justifySelf: 'end',
    alignSelf: 'center'
  }
}))

const Body = props => {
  const classes = useStyles()
  const { children } = props
  return (
    <>
      <div className={classes.itemLeft}>
        {children}
      </div>
    </>
  )
}

const actions = [<LayersPlus/>, <LayersMinus/>, <ContentDuplicate/>, <ExportVariant/>]
const tooltips = ["Add Layer","Delete Layer","Duplicat Layer","Share layer"]

const layers = [
  {
    name: 'EST Force Laydown',
    locked: false,
    visible: true
  },
  {
    name: 'FSCM',
    locked: false,
    visible: true
  },
  {
    name: 'Intel',
    locked: false,
    visible: true
  },
  {
    name: 'Main Supply Routes',
    locked: false,
    visible: false,
    selected: true
  },
  {
    name: 'Maritime',
    locked: true,
    visible: true
  }
]

const LayerList = props => {
  const classes = useStyles()

  const buttons = () => actions.map((action, index) => (
    <Tooltip title={tooltips[index]} > 
      <IconButton key={index} size='small'>
        { action }
      </IconButton>
    </Tooltip>
  ))

  const layer = (layer, index) => {
    console.log(layer.locked)
    const lockIcon = layer.locked ? <Lock/> : <LockOpen/>
    const visibleIcon = layer.visible ? <Eye/> : <EyeOff/>
    const body = layer.selected ? <b>{layer.name}</b> : layer.name
    return (
      <div key={index} className={classes.item}>
        <Body key={index}>{body}</Body>
        <div className={classes.itemRight}>
          <Tooltip title="Lock Layer" >
            <IconButton size='small'>{lockIcon}</IconButton>
          </Tooltip>
          <Tooltip title="Toggle Visibility" >
            <IconButton size='small'>{visibleIcon}</IconButton>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <Paper className={classes.panel} elevation={6}>
      {/* <ButtonGroup/> not supported for <IconButton> */}
      <div className={classes.buttonGroup}>
        { buttons() }
      </div>
      <List>{ layers.map(layer) }</List>
    </Paper>
  )
}

export default LayerList

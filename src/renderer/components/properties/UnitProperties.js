import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Badge, Paper, Tab, Tabs } from '@material-ui/core'
import EchelonProperty from './EchelonProperty'
import ReinforcedReduced from './ReinforcedReduced'
import ModifierProperty from './ModifierProperty'
import HostilityProperty from './HostilityProperty'
import StatusGroupFull from './StatusGroupFull'
import TextProperty from './TextProperty'

import { ipcRenderer } from 'electron'
import ReferenceList from '../references/ReferenceList'
import DropObjectTarget from '../references/DropObjectTarget'
import LinkIcon from '@material-ui/icons/LinkOutlined'
import DescriptionIcon from '@material-ui/icons/DescriptionOutlined'

const useStyles = makeStyles(theme => ({
  paper: {
    userSelect: 'none',
    padding: theme.spacing(3),
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R'
  },

  tabContent: {
    display: 'grid',
    gridGap: '0.5em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content',
    marginTop: theme.spacing(2)
  },

  twoColumns: { gridColumn: '1 / span 2' }
}))

const TabContent = props => {
  const { children, value, index, ...rest } = props
  return (
    <div
      role='tabcontent'
      hidden={value !== index}
      id={`tabcontent-${index}`}
      {...rest}
    >
      {value === index && (
        <>
          { children }
        </>
      )}
    </div>
  )
}
TabContent.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
}

const UnitProperties = props => {
  const classes = useStyles()

  const [tabIndex, setTabIndex] = React.useState(0)
  const handleTabIndexChange = (_, index) => setTabIndex(index)


  const [references, setReferences] = React.useState([])

  const handleObjectDropped = addedReference => {
    setReferences(current => [...current, addedReference])
  }

  const handleReferenceDeleted = (id) => {
    setReferences(current => current.filter(element => element.id !== id))
  }

  const handleLinkClicked = event => {
    const target = event.target
    if (target.protocol === 'file:') {
      event.preventDefault()
      ipcRenderer.send('IPC_OPEN_WITH_SHELL', { url: event.target.href })
    }
  }

  return (
    <Paper
      className={classes.paper}
      elevation={4}
    >
      <Tabs value={tabIndex} onChange={handleTabIndexChange}
        indicatorColor='primary'
        textColor='primary'
        variant='fullWidth'
        className={classes.tabs}
      >
        <Tab icon={<DescriptionIcon />} />
        <Tab icon={
          <Badge badgeContent={4} color="primary">
            <LinkIcon />
          </Badge>
        }/>
      </Tabs>
      <TabContent value={tabIndex} index={0} className={classes.tabContent}>
        <TextProperty label='Name' property='name' properties={props.properties} onCommit={props.update} className={classes.twoColumns}/>
        <TextProperty label='Unique Designation' property='t' properties={props.properties} onCommit={props.update}/>
        <TextProperty label='Higher Formation' property='m' properties={props.properties} onCommit={props.update}/>
        <TextProperty label='Special C2 HQ' property='aa' properties={props.properties} onCommit={props.update}/>
        <EchelonProperty properties={props.properties} onCommit={props.update}/>
        <HostilityProperty properties={props.properties} onCommit={props.update} className={classes.twoColumns}/>
        <TextProperty label='Date-Time Group' property='w' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
        <TextProperty label='Speed' property='z' properties={props.properties} onCommit={props.update}/>
        <TextProperty label='Direction' property='q' properties={props.properties} onCommit={props.update}/>
        <TextProperty label='Staff Comments' property='g' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
        <TextProperty label='Additional Information' property='h' className={classes.twoColumns} properties={props.properties} onCommit={props.update}/>
        <StatusGroupFull properties={props.properties} onCommit={props.update}/>
        <ModifierProperty properties={props.properties} onCommit={props.update}/>
        <ReinforcedReduced property='f' properties={props.properties} onCommit={props.update}/>
      </TabContent>
      <TabContent value={tabIndex} index={1} className={[classes.tabContent, classes.twoColumns]}>
        <DropObjectTarget onDropped={handleObjectDropped}/>
        <ReferenceList references={references} onClick={handleLinkClicked} onDelete={handleReferenceDeleted}/>
      </TabContent>
    </Paper>
  )
}

UnitProperties.propTypes = {
  properties: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired
}

export default UnitProperties

import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Badge, Paper, Tab, Tabs } from '@material-ui/core'
import LinkIcon from '@material-ui/icons/LinkOutlined'
import DescriptionIcon from '@material-ui/icons/DescriptionOutlined'
import TabContent from './TabContent'
import ReferenceList from '../references/ReferenceList'
import DropObjectTarget from '../references/DropObjectTarget'

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
  }
}))

const PropertyPanelContent = props => {
  const classes = useStyles()
  const { children, properties: featureProperties, update } = props

  const [tabIndex, setTabIndex] = React.useState(0)
  const [references, setReferences] = React.useState(featureProperties.references)

  React.useEffect(() => {
    const properties = { ...featureProperties }
    properties.references = references
    update(properties)
  }, [references])

  React.useEffect(() => {
    setReferences(featureProperties.references)
  }, [featureProperties])

  const handleTabIndexChange = (_, index) => setTabIndex(index)

  const handleObjectDropped = addedReference => {
    if (references.find(reference => reference.url === addedReference.url)) return
    setReferences(current => [...current, addedReference])
  }

  const handleReferenceDeleted = (url) => {
    setReferences(current => current.filter(element => element.url !== url))
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
          <Badge badgeContent={references.length} color="primary">
            <LinkIcon />
          </Badge>
        }/>
      </Tabs>
      <TabContent value={tabIndex} index={0} className={classes.tabContent}>
        { children }
      </TabContent>
      <TabContent value={tabIndex} index={1} className={[classes.tabContent, classes.twoColumns]}>
        <DropObjectTarget onDropped={handleObjectDropped}/>
        <ReferenceList references={references} onDelete={handleReferenceDeleted}/>
      </TabContent>
    </Paper>
  )
}

PropertyPanelContent.propTypes = {
  children: PropTypes.object,
  properties: PropTypes.object,
  update: PropTypes.func
}

export default PropertyPanelContent

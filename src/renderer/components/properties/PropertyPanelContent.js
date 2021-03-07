import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { Badge, Paper, Tab, Tabs, Tooltip } from '@material-ui/core'
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
  const { t } = useTranslation()
  const { children, getProperties, update } = props

  const [tabIndex, setTabIndex] = React.useState(0)
  const [references, setReferences] = React.useState(getProperties().references)

  React.useEffect(() => {
    update({ references: references })
  }, [references])

  React.useEffect(() => {
    setReferences(getProperties().references)
  })

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
        <Tooltip title={t('propertyPanel.tabs.properties')}>
          <Tab icon={<DescriptionIcon />} />
        </Tooltip>
        <Tooltip title={t('propertyPanel.tabs.references')}>
          <Tab icon={
            <Badge badgeContent={references.length} color="primary">
              <LinkIcon />
            </Badge>} />
        </Tooltip>
      </Tabs>
      <TabContent value={tabIndex} index={0} className={classes.tabContent}>
        { children }
      </TabContent>
      <TabContent value={tabIndex} index={1} className={[classes.tabContent, classes.twoColumns]} style={{ height: '100%' }}>
        <Tooltip title={t('propertyPanel.references.dropObjectTarget')}>
          <div comment='this is required in order to make the tooltip work'>
            <DropObjectTarget onDropped={handleObjectDropped}/>
          </div>
        </Tooltip>
        <div style={{ maxHeight: '85%', overflow: 'scroll' }} >
          <ReferenceList references={references} onDelete={handleReferenceDeleted} />
        </div>
      </TabContent>
    </Paper>
  )
}

PropertyPanelContent.propTypes = {
  children: PropTypes.object,
  getProperties: PropTypes.func,
  update: PropTypes.func
}

export default PropertyPanelContent

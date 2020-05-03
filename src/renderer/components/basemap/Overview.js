import React from 'react'
import PropTypes from 'prop-types'

import SourceDescriptorList from './SourceDescriptorList'
import { Button } from '@material-ui/core'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'

const Overview = props => {
  const { classes, t } = props
  const { onDescriptorSelected, onDescriptorEdited, onNew, forceReload } = props

  return (
    <>
      <div className={classes.actions}>
        <Button id="newSourceDescriptor" variant="contained" color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onNew}
        >
          {t('basemapManagement.new')}
        </Button>
      </div>
      <div className={classes.sourceList}>
        <SourceDescriptorList
          onDescriptorSelected={onDescriptorSelected}
          onDescriptorEdited={onDescriptorEdited}
          forceReload={forceReload}
        />
      </div>
    </>
  )
}
Overview.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  onNew: PropTypes.func,
  onDescriptorSelected: PropTypes.func,
  onDescriptorEdited: PropTypes.func,
  forceReload: PropTypes.bool
}

export default Overview

import React from 'react'
import Tooltip from '@material-ui/core/Tooltip'

export default (prop) => {
  const { title, placement } = prop
  return (<Tooltip placement={placement} title={title} enterDelay={1200} TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
    {prop.children}
  </Tooltip>)
}



import React from 'react'
import Tooltip from '@material-ui/core/Tooltip'
import Fade from '@material-ui/core/Fade'

export default (prop) => {
  const { title, placement } = prop
  return (
    <Tooltip
      placement={placement}
      title={title}
      enterDelay={1200}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 600 }}>
      {prop.children}
    </Tooltip>
  )
}



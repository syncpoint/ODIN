import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'

import uuid from 'uuid-random'

const useStyles = makeStyles(theme => ({
  dropContainer: {
    width: '100%',
    height: theme.spacing(6),
    border: 'black dashed thin',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'link'
  }
}))

const DropObjectTarget = props => {
  const classes = useStyles()
  const { onDropped } = props

  const dropHandler = event => {
    event.preventDefault()

    for (const file of event.dataTransfer.files) {
      if (file.type) {
        // only add files with a known mime type
        onDropped({ id: uuid(), name: file.name, url: `file:${file.path}` })
      }
    }

    for (const item of event.dataTransfer.items) {
      if (item.type === 'text/uri-list') {
        item.getAsString(function (arg) {
          const url = new URL(arg)
          if (url.hostname && url.href) {
            onDropped({ id: uuid(), name: url.hostname, url: url.href })
          }
        })
      }
    }
  }

  const dragOverHandler = event => {
    event.preventDefault()
    event.dataTransfer.dropAffect = 'link'
  }

  const dragEnterHandler = event => {
    event.preventDefault()
  }

  const dragLeaveHandler = event => {
    event.preventDefault()
  }

  return (
    <div className={classes.dropContainer}
      onDrop={dropHandler} onDragOver={dragOverHandler} onDragLeave={dragLeaveHandler}
      onDragEnter={dragEnterHandler} id='drop-object-target'
    >
      drop new documents or links here
    </div>
  )
}

DropObjectTarget.propTypes = {
  onDropped: PropTypes.func.isRequired
}

export default DropObjectTarget

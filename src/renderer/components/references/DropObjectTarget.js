import React from 'react'
import PropTypes from 'prop-types'
import uuid from 'uuid-random'
import SaveAltIcon from '@material-ui/icons/SaveAlt'
import { makeStyles } from '@material-ui/core/styles'

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
    console.dir(event)
    for (const file of event.dataTransfer.files) {
      const fileUrl = new URL(`file:${file.path}`)
      onDropped({ id: uuid(), name: file.name, url: fileUrl.href })
    }

    for (const item of event.dataTransfer.items) {
      if (item.type === 'text/uri-list') {
        item.getAsString(function (arg) {
          const url = new URL(arg)
          if (url.hostname && url.href) {
            onDropped({ id: uuid(), name: url.origin, url: url.href })
          }
        })
      }
    }
  }

  const dragOverHandler = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'link'
  }

  const dragEnterHandler = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'link'
  }

  const dragLeaveHandler = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'link'
  }

  return (
    <div className={classes.dropContainer}
      onDrop={dropHandler} onDragOver={dragOverHandler} onDragLeave={dragLeaveHandler}
      onDragEnter={dragEnterHandler} id='drop-object-target'
    >
      <SaveAltIcon />
    </div>
  )
}

DropObjectTarget.propTypes = {
  onDropped: PropTypes.func.isRequired
}

export default DropObjectTarget

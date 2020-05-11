import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputBase } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  editor: {
    paddingLeft: '8px',
    paddingTop: '2px',
    paddingBottom: '1px',
    borderBottom: '1px solid #cccccc',
    width: '100%'
  }
}))

/**
 *
 */
export const LayerNameEditor = props => {
  const classes = useStyles()

  const handleChange = event => props.update(event.target.value)
  const handleKeyDown = event => {
    switch (event.key) {
      case 'Enter': return props.commit()
      case 'Escape': return props.cancel()
    }
  }

  return (
    <InputBase
      className={classes.editor}
      value={props.value}
      autoFocus
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onBlur={props.cancel}
    />
  )
}

LayerNameEditor.propTypes = {
  value: PropTypes.string.isRequired,

  /**
   * cancel :: () -> unit
   * Cancel editor, layer name remains unchanged.
   */
  cancel: PropTypes.func.isRequired,

  /**
   * commit :: () -> unit
   * Set editor value as new layer name.
   */
  commit: PropTypes.func.isRequired,

  /**
   * update :: string -> unit
   * Update editor value.
   */
  update: PropTypes.func.isRequired
}

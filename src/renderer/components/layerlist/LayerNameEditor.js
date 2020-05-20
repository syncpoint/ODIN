import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputBase } from '@material-ui/core'
import { noop } from '../../../shared/combinators'

const useStyles = makeStyles((theme) => ({
  editor: {
    paddingLeft: '8px',
    paddingTop: '2px',
    paddingBottom: '1px',
    borderBottom: '1px solid #cccccc',
    width: '100%'
  },
  error: {
    fontSize: '0.8em',
    paddingLeft: '8px',
    paddingTop: '2px',
    paddingBottom: '18px',
    color: 'red',
    borderBottom: '1px solid #cccccc',
    width: '100%'
  }
}))

const ErrorMessage = props => {
  const classes = useStyles()
  return <div className={classes.error}>{props.message}</div>
}

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired
}

/**
 *
 */
export const LayerNameEditor = props => {
  const classes = useStyles()

  const handleChange = event => props.update(event.target.value)
  const handleKeyDown = event => {
    switch (event.key) {
      case 'Enter': return (props.error ? noop : props.commit)()
      case 'Escape': return props.cancel()
    }
  }

  const style = props.error ? { borderBottom: '1px solid red' } : {}
  const errorMessage = () => props.error
    ? <ErrorMessage message={props.error}/>
    : null

  return (
    <div>
      <InputBase
        className={classes.editor}
        style={style}
        value={props.value}
        autoFocus
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={props.cancel}
      />
      { errorMessage() }
    </div>
  )
}

LayerNameEditor.propTypes = {
  value: PropTypes.string.isRequired,

  error: PropTypes.string, // optional error message

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

import PropTypes from 'prop-types'
import React, { useCallback, useRef, useState } from 'react'
import { RgbaStringColorPicker } from 'react-colorful'
import { makeStyles } from '@material-ui/core/styles'
import useClickOutside from './useClickOutside'

const useStyles = makeStyles(theme => ({
  swatch: {
    width: '36px',
    height: '22px',
    borderRadius: '8px',
    border: '3px solid #fff',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer'
  },

  popover: {
    position: 'absolute',
    top: '100',
    right: '0',
    borderRadius: '9px',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 20
  }
}))

const PopoverPicker = ({ color, onChange, style }) => {
  const classes = useStyles()
  const popover = useRef()
  const [isOpen, toggle] = useState(false)

  const close = useCallback(() => toggle(false), [])
  useClickOutside(popover, close)

  return (
    <div style={style}>
      <div
        className={classes.swatch}
        style={{ backgroundColor: color }}
        onClick={() => toggle(true)}
      />

      {isOpen && (
        <div className={classes.popover} ref={popover}>
          <RgbaStringColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  )
}


PopoverPicker.propTypes = {
  color: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PopoverPicker

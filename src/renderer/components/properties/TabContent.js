import React from 'react'
import PropTypes from 'prop-types'

const TabContent = props => {
  const { children, value, index, ...rest } = props
  return (
    <div
      role='tabcontent'
      hidden={value !== index}
      id={`tabcontent-${index}`}
      {...rest}
    >
      {value === index && (
        <>
          { children }
        </>
      )}
    </div>
  )
}
TabContent.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
}

export default TabContent

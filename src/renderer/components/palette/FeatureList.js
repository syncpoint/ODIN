import React from 'react'
import PropTypes from 'prop-types'
import { VariableSizeList } from 'react-window'
import FeatureItem from './FeatureItem'

const FeatureList = props => {
  const { listItems, handleClick, height } = props

  const getItemSize = index => {
    const descriptor = listItems[index]
    const textLength = descriptor.name.length + descriptor.hierarchy.length
    console.log('##length', textLength, descriptor.name + ' ' + descriptor.hierarchy)
    if (textLength <= 45) return 80
    if (textLength <= 65) return 100
    if (textLength <= 85) return 120
    if (textLength <= 105) return 140
    return 160
  }

  return (

    <VariableSizeList
      itemCount={listItems.length}
      itemSize={getItemSize}
      itemData={listItems}
      estimatedItemSize={90}
      height={height}
      width={'100%'}
    >
      {({ index, style }) => {
        const descriptor = listItems[index]
        return <div style={style}><FeatureItem {...descriptor} key={descriptor.sortKey} onClick={handleClick(descriptor)} /></div>
      }}
    </VariableSizeList>

  )
}

FeatureList.propTypes = {
  listItems: PropTypes.array,
  height: PropTypes.number,
  handleClick: PropTypes.func
}

export default FeatureList

import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, InputBase, Paper } from '@material-ui/core'
import ClearIcon from '@material-ui/icons/Clear'
import { useIMask, IMask } from 'react-imask'
// eslint-disable-next-line import/no-named-default
import { default as MGRS, LatLon } from 'geodesy/mgrs'


const mgrsMask = new IMask.MaskedPattern({
  name: 'MGRS',
  mask: 'ZONEGRID{ }COLROW{ }N{ }N',
  blocks: {
    ZONE: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 60
    },
    GRID: {
      mask: IMask.MaskedEnum,
      enum: ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y']
    },
    COL: {
      mask: IMask.MaskedEnum,
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    },
    ROW: {
      mask: IMask.MaskedEnum,
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V']
    },
    N: {
      mask: /^[0-9]{1,5}$/
    }
  },
  prepare: value => value.toUpperCase()
})

/* paste from openstreetmap */
const latLonDegShortMask = IMask.createMask({
  name: 'LL-DEG-SHORT',
  mask: 'DNS[,][ ]{ }DEW',
  blocks: {
    DNS: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 90,
      signed: true,
      scale: 6,
      radix: '.',
      padFractionalZeros: false,
      normalizeZeros: false,
      overwrite: true
    },
    DEW: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 180,
      signed: true,
      scale: 6,
      radix: '.',
      padFractionalZeros: false,
      normalizeZeros: false,
      overwrite: true
    }
  }
})

/* paste from google maps */
const latLonDegLongMask = IMask.createMask({
  name: 'LL-DEG-LONG',
  mask: 'DNS[,][ ]{ }DEW',
  blocks: {
    DNS: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 90,
      signed: true,
      scale: 15, //!
      radix: '.',
      padFractionalZeros: false,
      normalizeZeros: false,
      overwrite: true
    },
    DEW: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 180,
      signed: true,
      scale: 15, //!
      radix: '.',
      padFractionalZeros: false,
      normalizeZeros: false,
      overwrite: true
    }
  }
})

// [15.617595371652579,48.321868556411715]
const degODINMask = IMask.createMask({
  name: 'LL-ODIN',
  mask: '\\[DEW{, }DNS\\]',
  blocks: {
    DNS: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 90,
      signed: true,
      scale: 15,
      radix: '.'
    },
    DEW: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 180,
      signed: true,
      scale: 15,
      radix: '.'
    }
  }
})


const buildTarget = (value, format) => {
  if (!value || !format) {
    return undefined
  }
  // console.log(value, format)
  switch (format) {
    case 'MGRS': {
      try {
        const mgrs = MGRS.parse(value)
        const coordinates = mgrs.toUtm().toLatLon()
        return { lat: coordinates.lat, lon: coordinates.lon, source: 'MGRS' }
      } catch (error) {
        return undefined
      }
    }
    case 'LL-DEG-LONG':
    case 'LL-DEG-SHORT': {
      try {
        const parts = value.replace(',', '').split(' ')
        const coordinate = new LatLon(parts[0], parts[1])
        return { lat: coordinate.lat, lon: coordinate.lon, source: 'LL-DEG' }
      } catch (error) {
        return undefined
      }
    }
    case 'LL-ODIN': {
      const coordinates = value.split(',').map(part => Number.parseFloat(part))
      if (!coordinates[0] || !coordinates[1]) return undefined
      return { lat: coordinates[1], lon: coordinates[0], source: 'LL-ODIN' }
    }
    default: {
      console.warn(`Unable to convert ${value} from format ${format}`)
      return undefined
    }
  }
}


const CoordinatesInput = props => {

  const handleAccept = (value, { masked }) => {
    if (!props.onChange) return // no handler attached?
    const target = (masked.currentMask?.isComplete ? buildTarget(masked.currentMask.unmaskedValue, masked.currentMask?.name) : undefined)
    props.onChange(target)
  }

  const { ref, maskRef } = useIMask(
    {
      mask: [mgrsMask, latLonDegShortMask, latLonDegLongMask, degODINMask],
      unmask: true,
      dispatch: (appended, dynamicMasked) => {
        const value = `${dynamicMasked.typedValue}${appended}`
        // console.log('#dispatch', value)
        if (value && value.startsWith('[')) {
          // ODIN coordinates
          return dynamicMasked.compiledMasks.find(m => m.name === 'LL-ODIN')
        } else if (value && value.match(/^\d{2}\w{1}/)) {
          return dynamicMasked.compiledMasks.find(m => m.name === 'MGRS')
        } else {
          /*
            This one was VERY TRICKY! In order to support copy and paste operations from
            * Apple Maps: scale 6
            * OSM: scale 5
            * Google Maps: scale 15
            we had to use two different masks that have a different scale. Padding with
            zeros and many other options made the result even worse.
            Manually using the appropriate mask was the only thing that worked.
          */
          const shortMask = dynamicMasked.compiledMasks.find(m => m.name === 'LL-DEG-SHORT')
          const longMask = dynamicMasked.compiledMasks.find(m => m.name === 'LL-DEG-LONG')

          // 33.172736252425845
          if (dynamicMasked.rawInputValue.length > 7) return longMask
          return shortMask
        }
      }
    },
    {
      onAccept: handleAccept
    }
  )

  return (
    <Paper style={{ display: 'flex', justifyContent: 'space-between' }} variant='outlined'>
      <InputBase style={{ flex: 1 }}
        name="Coordinates"
        id="formatted-text-mask-input"
        inputRef={ref}
        placeholder='MGRS (UTMREF), LAT/LON (Deg)'
      />
      <IconButton size='small' onClick={() => {
        ref.current.value = ''
        maskRef.current.masked.reset()
        props.onChange(undefined)
      }}><ClearIcon /></IconButton>
    </Paper>
  )
}

CoordinatesInput.propTypes = {
  onChange: PropTypes.func
}

export default CoordinatesInput

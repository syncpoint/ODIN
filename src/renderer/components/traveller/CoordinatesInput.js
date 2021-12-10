import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, Input } from '@material-ui/core'
import { useIMask, IMask } from 'react-imask'
// eslint-disable-next-line import/no-named-default
import { default as MGRS, Utm as UTM, LatLon } from 'geodesy/mgrs'


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
      mask: IMask.MaskedNumber,
      min: 0,
      max: 99999,
      signed: false,
      scale: 0
    }
  },
  prepare: value => value.toUpperCase()
})

const utmMask = new IMask.MaskedPattern({
  name: 'UTM',
  mask: 'ZONE{ }GRID{ }NL{ }NL',
  blocks: {
    ZONE: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 60
    },
    GRID: {
      mask: IMask.MaskedEnum,
      enum:
      ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y']
    },
    NL: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 999999.999,
      signed: false,
      scale: 3,
      radix: '.',
      mapToRadix: [',']
    }
  },
  prepare: value => value.toUpperCase()
})

const degMask = IMask.createMask({
  name: 'LL-DEG',
  mask: 'DNS°lon{ }DEW°l\\at',
  blocks: {
    DNS: {
      mask: IMask.MaskedNumber,
      min: -90,
      max: 90,
      signed: true,
      scale: 5,
      radix: '.',
      mapToRadix: [',']
    },
    DEW: {
      mask: IMask.MaskedNumber,
      min: -180,
      max: 180,
      signed: true,
      scale: 5,
      radix: '.',
      mapToRadix: [',']
    }
  }
})

// [15.617595371652579,48.321868556411715]
const degODINMask = IMask.createMask({
  name: 'LL-ODIN',
  mask: '[DEW{, }DNS]',
  blocks: {
    DNS: {
      mask: IMask.MaskedNumber,
      min: -90,
      max: 90,
      signed: true,
      scale: 15,
      radix: '.',
      mapToRadix: [',']
    },
    DEW: {
      mask: IMask.MaskedNumber,
      min: -180,
      max: 180,
      signed: true,
      scale: 15,
      radix: '.',
      mapToRadix: [',']
    }
  }
})


const buildTarget = (value, format) => {
  if (!value || !format) {
    console.error('value or format not defined')
    return undefined
  }

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
    case 'UTM': {
      try {
        const utm = UTM.parse(value)
        const coordinates = utm.toLatLon()
        return { lat: coordinates.lat, lon: coordinates.lon, source: 'UTM' }
      } catch (error) {
        return undefined
      }
    }
    case 'LL-DEG': { // LON-LAT
      try {
        const parts = value.split(' ')
        const coordinate = new LatLon(parts[1], parts[0])
        return { lat: coordinate.lat, lon: coordinate.lon, source: 'LL-DEG' }
      } catch (error) {
        return undefined
      }
    }
    case 'LL-ODIN': {
      const coordinates = value.split(',').map(part => Number.parseFloat(part))
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
    console.dir(target)
    props.onChange(target)
  }

  const { ref } = useIMask(
    {
      mask: [mgrsMask, utmMask, degMask, degODINMask],
      unmask: true
    },
    {
      onAccept: handleAccept
    }
  )

  return (
    <FormControl variant='outlined' fullWidth={true}>
        <Input
          name="Coordinates"
          id="formatted-text-mask-input"
          inputRef={ref}
          placeholder='MGRS, UTM, LON LAT (Deg)'
        />
      </FormControl>
  )
}

CoordinatesInput.propTypes = {
  onChange: PropTypes.func
}

export default CoordinatesInput

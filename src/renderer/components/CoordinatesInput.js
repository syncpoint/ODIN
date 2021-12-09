import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, Input, InputLabel } from '@material-ui/core'
import { useIMask, IMask } from 'react-imask'
// eslint-disable-next-line import/no-named-default
import { default as MGRS, Utm as UTM, Dms as DMS } from 'geodesy/mgrs'


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
  name: 'DMS',
  mask: 'DNS°N DEW°W',
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
  name: 'DMSODIN',
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
        return { lat: coordinates.lat, lon: coordinates.lon }
      } catch (error) {
        return undefined
      }
    }
    case 'UTM': {
      try {
        const utm = UTM.parse(value)
        const coordinates = utm.toLatLon()
        return { lat: coordinates.lat, lon: coordinates.lon }
      } catch (error) {
        return undefined
      }
    }
    case 'DMS': {
      try {
        const dms = DMS.parse(value)
        return { lat: dms.lat, lon: dms.lon }
      } catch (error) {
        return undefined
      }
    }
    case 'DMSODIN': {
      const coordinates = value.split(',').map(part => Number.parseFloat(part))
      return { lat: coordinates[1], lon: coordinates[0] }
    }
    default: {
      console.warn(`Unable to convert ${value} from format ${format}`)
      return undefined
    }
  }
}


const CoordinatesInput = props => {

  const handleComplete = (value, { masked }) => {
    console.log(`completed ${value} from mask ${masked.currentMask?.name}`)
    const target = buildTarget(value, masked.currentMask?.name)
    if (props.onCompleted) props.onCompleted(target)
  }
  const { ref } = useIMask(
    {
      mask: [mgrsMask, utmMask, degMask, degODINMask],
      unmask: true
    },
    { onComplete: handleComplete }
  )

  return (
    <FormControl variant="standard" fullWidth={true}>
        <InputLabel htmlFor="formatted-text-mask-input">Coordinates</InputLabel>
        <Input
          name="Coordinates"
          id="formatted-text-mask-input"
          inputRef={ref}
          placeholder='MGRS, UTM, LON/LAT (DMS)'
        />
      </FormControl>
  )
}

CoordinatesInput.propTypes = {
  onCompleted: PropTypes.func
}

export default CoordinatesInput

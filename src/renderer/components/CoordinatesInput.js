import React from 'react'
import { FormControl, Input, InputLabel } from '@material-ui/core'

import { useIMask, IMask } from 'react-imask'

// const mgrsExpression = /[0-9]{2}[CDEFGHJKLMNPQRSTUVW]{1}\s?[A-Z]{2}\s?[0-9]{1,5}\s?[0-9]{1,5}/g

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
  mask: 'ZONEGRID{ }NL{ }NL',
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
      max: 999999,
      signed: false,
      scale: 0
    }
  },
  prepare: value => value.toUpperCase()
})

const degMask = IMask.createMask({
  name: 'DEG',
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
  name: 'DEGODIN',
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


const CoordinatesInput = props => {

  const handleComplete = (value, { masked }) => {
    console.log(`completed ${value} from mask ${masked.currentMask?.name}`)
  }
  const { ref } = useIMask(
    {
      mask: [mgrsMask, utmMask, degMask, degODINMask],
      unmask: true
    },
    { onComplete: handleComplete }
  )
  console.dir(ref)
  return (
    <FormControl variant="standard" fullWidth={true}>
        <InputLabel htmlFor="formatted-text-mask-input">Coordinates</InputLabel>
        <Input
          name="Coordinates"
          id="formatted-text-mask-input"
          inputRef={ref}
          placeholder='MGRS, UTM, LON/LAT'
        />
      </FormControl>
  )
}



export default CoordinatesInput

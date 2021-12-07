import React from 'react'
import { IMaskInput, IMask } from 'react-imask'

// const mgrsExpression = /[0-9]{2}[CDEFGHJKLMNPQRSTUVW]{1}\s?[A-Z]{2}\s?[0-9]{1,5}\s?[0-9]{1,5}/g

const mgrsMask = new IMask.MaskedPattern({
  name: 'MGRS',
  mask: 'MMB{ }aa{ }RR{ }RR',
  blocks: {
    MM: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 60
    },
    B: {
      mask: IMask.MaskedEnum,
      enum:
      ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y']
    },
    RR: {
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
  mask: 'MMB{ }SS{ }SS',
  blocks: {
    MM: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 60
    },
    B: {
      mask: IMask.MaskedEnum,
      enum:
      ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y']
    },
    SS: {
      mask: IMask.MaskedNumber,
      min: 0,
      max: 999999,
      signed: false,
      scale: 0
    }
  },
  prepare: value => value.toUpperCase()
})

const degMask = new IMask.MaskedPattern({
  name: 'DEG',
  mask: 'DNS{°N }DEW{°W}',
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

const degODINMask = new IMask.MaskedPattern({
  name: 'DEGODIN',
  mask: '{[}DEW{, }DNS{]}',
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



const MGRSInput = props => (
  <IMaskInput
  mask={[mgrsMask, utmMask, degMask, degODINMask]}
  unmask={'typed'} // true|false|'typed'
  onAccept={
    // depending on prop above first argument is
    // `value` if `unmask=false`,
    // `unmaskedValue` if `unmask=true`,
    // `typedValue` if `unmask='typed'`
    (typedValue, mask) => {
      console.log(typedValue)
      console.dir(mask)
    }
  }
  // ...and more mask props in a guide

  // input props also available
  placeholder='MGRS, UTM, DEG'
/>
)

export default MGRSInput

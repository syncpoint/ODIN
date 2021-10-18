import React from 'react'
import { IMaskInput, IMask } from 'react-imask'

const mgrsExpression = /[0-9]{2}[CDEFGHJKLMNPQRSTUVW]{1}\s?[A-Z]{2}\s?[0-9]{1,5}\s?[0-9]{1,5}/g

const mgrsMask = new IMask.MaskedPattern({
  mask: '00a{ }aa{ }r{ }r',
  definitions: {
    z: new IMask.MaskedRange({
      from: 1,
      to: 60
    }),
    b: new IMask.MaskedEnum([
      'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'
    ]),
    r: /\d{1,5}/
  }
})

const MGRSInput = props => (
  <IMaskInput
  mask={mgrsMask}
  unmask={true} // true|false|'typed'
  onAccept={
    // depending on prop above first argument is
    // `value` if `unmask=false`,
    // `unmaskedValue` if `unmask=true`,
    // `typedValue` if `unmask='typed'`
    (value, mask) => console.log(value)
  }
  // ...and more mask props in a guide

  // input props also available
  placeholder='33T XP 23098 87145'
/>
)

export default MGRSInput

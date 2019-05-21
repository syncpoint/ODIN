import assert from 'assert'
import Dms from 'geodesy/dms'

// Default separator is U+202F ‘narrow no-break space’.
const defaultSeparator = Dms.separator

// NOTE: Sadly, typographic `′` and `″` are hard-coded.
describe('Dms', function () {
  it(`#toLat(format: 'd')`, function () {
    /* eslint-disable no-irregular-whitespace */
    assert.strictEqual(Dms.toLat(-3.62, 'd'), '03.6200° S')
    Dms.separator = ''
    assert.strictEqual(Dms.toLat(-3.62, 'd'), '03.6200°S')
    Dms.separator = defaultSeparator
  })

  it(`#toLat(format: 'dms')`, function () {
    /* eslint-disable no-irregular-whitespace */
    assert.strictEqual(Dms.toLat(-3.62, 'dms'), '03° 37′ 12″ S')
    Dms.separator = ''
    assert.strictEqual(Dms.toLat(-3.62, 'dms'), '03°37′12″S')
    Dms.separator = defaultSeparator
  })
})

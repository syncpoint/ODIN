import assert from 'assert'
import selection from '../../src/renderer/selection'

describe('selection', function () {

  beforeEach(function () {
    selection.deselect()
  })

  afterEach(function () {
    // Make sure we have no listener leak in tests.
    assert.strictEqual(0, selection.listenerCount('selected'))
    assert.strictEqual(0, selection.listenerCount('deselected'))
  })

  it('#select() expects array argument', function () {
    assert.throws(() => selection.select('xyz'), {
      message: 'invalid argument; array expected'
    })
  })

  it('#select() expects string elements (URIs)', function () {
    assert.throws(() => selection.select([42]), {
      message: 'invalid argument; string element expected'
    })
  })

  it("#select() triggers 'selected' event", function (done) {
    const expected = ['uri:a', 'uri:b']

    const selected = uris => {
      selection.off('selected', selected)
      assert.deepEqual(expected, uris)
      done()
    }

    selection.on('selected', selected)
    selection.select(expected)
  })

  it('#select() adds selections', function () {
    selection.select(['uri:a'])
    selection.select(['uri:b'])
    selection.select(['uri:c'])
    assert.deepEqual(['uri:a', 'uri:b', 'uri:c'], selection.selected())
  })

  it('#select() ignores already selected', function () {
    selection.select(['uri:a'])
    selection.select(['uri:a'])
    assert.deepEqual(['uri:a'], selection.selected())
  })

  it("#deselect() triggers 'deselected' event", function (done) {
    const expected = ['uri:a', 'uri:b']

    const deselected = uris => {
      selection.off('deselected', deselected)
      assert.deepEqual(expected, uris)
      done()
    }

    selection.on('deselected', deselected)
    selection.select(expected)
    selection.deselect()
  })

  it("#deselect([uri]) triggers 'deselected' event", function (done) {
    const deselected = uris => {
      selection.off('deselected', deselected)
      assert.deepEqual(['uri:b'], uris)
      done()
    }

    selection.on('deselected', deselected)
    selection.select(['uri:a', 'uri:b'])
    selection.deselect(['uri:b'])
  })

  it('#deselect([uri]) ignores deselected', function () {
    selection.select(['uri:a', 'uri:b'])
    selection.deselect(['uri:c'])
    assert.deepEqual(['uri:a', 'uri:b'], selection.selected())
  })

  it('#isSelected() checks whether single URI is selected', function () {
    selection.select(['uri:a'])
    assert.strictEqual(selection.isSelected('uri:a'), true)
    assert.strictEqual(selection.isSelected('uri:b'), false)
  })

  it('#isEmpty() checks whether there is a selection', function () {
    selection.select(['uri:a'])
    assert.strictEqual(selection.isEmpty(), false)
    selection.deselect()
    assert.strictEqual(selection.isEmpty(), true)
  })

  it('#selected() yields current selections', function () {
    selection.select(['uri:a'])
    selection.select(['uri:b', 'uri:c'])
    selection.deselect(['uri:b'])
    assert.deepEqual(['uri:a', 'uri:c'], selection.selected())
  })
})

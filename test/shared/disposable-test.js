import assert from 'assert'
import * as R from 'ramda'
import disposable from '../../src/shared/disposable'

describe('disposable', function () {

  it('initially is not disposed', function () {
    const x = disposable.of()
    assert.strictEqual(x.disposed(), false)
  })

  it('is disposed after disposing', function () {
    const x = disposable.of()
    x.dispose()
    assert.strictEqual(x.disposed(), true)
  })

  it('calls disposables in insert order', function () {
    let expected = 0
    const x = disposable.of()
    R.range(0, 10).forEach(index => {
      x.addDisposable(() => {
        assert.strictEqual(index, expected)
        expected += 1
      })
    })

    x.dispose()
    assert.strictEqual(expected, 10)
  })

  it('calls identical disposables only once', function () {
    let expected = 0
    const a = () => (expected += 1)

    // Add same disposable several times:
    const x = disposable.of()
    R.range(0, 10).forEach(() => x.addDisposable(a))
    x.dispose()

    // It should be called only once.
    assert.strictEqual(expected, 1)
  })

  it('does not call removed disposables', function () {
    let expected = false
    const x = disposable.of()
    const a = () => (expected = true)
    const b = () => assert.strictEqual(expected, false)
    x.addDisposable(a)
    x.addDisposable(b)
    x.removeDisposable(a)
    x.dispose()
  })
})

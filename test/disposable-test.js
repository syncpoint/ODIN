const assert = require('assert')
const Disposable = require('../js/renderer/common/disposable')

describe('disposable', function() {
  it('should update state correctly', function() {
    const a = Disposable.of({})
    assert.strictEqual(a.disposed(), false)
    a.dispose()
    assert.strictEqual(a.disposed(), true)
  })

  it('dispose() is idempotent', function() {
    const a = Disposable.of({})
    a.dispose()
    a.dispose()
    assert.strictEqual(a.disposed(), true)
  })

  it('disposables are called once', function() {
    const a = Disposable.of({})
    let called = 0

    // add same disposable twice:
    const x = () => ( called += 1 )
    a.addDisposable(x)
    a.addDisposable(x)
    a.dispose()
    assert.strictEqual(1, called)
  })

  it('disposables can be removed (before dispose())', function() {
    const a = Disposable.of({})
    let called = 0
    const x = () => ( called += 1 )

    a.addDisposable(x)
    a.removeDisposable(x)
    a.dispose()
    assert.strictEqual(0, called)
  })

  it('removing unknown disposable has no effect', function() {
    const a = Disposable.of({})
    a.removeDisposable(() => {})
    a.dispose()
  })

  it('removing disposable after dispose() has no effect', function() {
    const a = Disposable.of({})
    let called = 0
    const x = () => ( called += 1 )

    a.addDisposable(x)
    a.dispose()
    a.removeDisposable(x)
    a.dispose()
    assert.strictEqual(1, called)
  })
})
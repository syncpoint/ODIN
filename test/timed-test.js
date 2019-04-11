const assert = require('assert')
const Timed = require('../lib/timed')

describe('timed', function() {
  it('timer should run out without refresh', function(done) {
    Timed.of(10, done)({})
  })

  it('timer can be cleared', function(done) {
    let called = 0
    const timer = Timed.of(5, () => called += 1)({})
    timer.clearTimeout()
    setTimeout(() => {
      assert.strictEqual(called, 0)
      done()
    }, 10)
  })

  it('refresh prevents timer from running out', function(done) {
    let called = 0
    let refreshCount = 3
    const timer = Timed.of(10, () => called += 1)({})

    const interval = setInterval(() => {
      timer.refreshTimeout(10)
      refreshCount -= 1
      if(!refreshCount) {
        clearInterval(interval)
        assert.strictEqual(called, 0)
        done()
      }
    }, 5)
  })

  it('timer is re-usable after running out', function(done) {
    let called = 0
    const timer = Timed.of(5, () => {
      called += 1
      switch(called) {
        case 1: return timer.refreshTimeout(5) // once again...
        case 2: return done()
      }
    })({})
  })
})

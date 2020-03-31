import assert from 'assert'
import * as R from 'ramda'
import { noop } from '../../src/shared/combinators'
import undo from '../../src/renderer/undo'

describe('undo', function () {
  beforeEach(function () {
    undo.clear()
  })

  it('cannot undo with empty undo stack', function () {
    assert.strictEqual(undo.canUndo(), false)
  })

  it('cannot redo with empty redo stack', function () {
    assert.strictEqual(undo.canRedo(), false)
  })

  it('undo is noop for empty undo stack', function () {
    undo.undo()
  })

  it('redo is noop for empty redo stack', function () {
    undo.redo()
  })

  it('only accepts valid commands', function () {
    assert.throws(() => undo.push({}), {
      message: "invalid command; missing 'apply' function"
    })

    assert.throws(() => undo.push({ apply: noop }), {
      message: "invalid command; missing 'inverse' function"
    })

    // OK, except inverse does not return valid command.
    undo.push({ apply: noop, inverse: noop })
  })

  it('undo checks for valid inverse command (undefined)', function () {
    undo.push({ apply: noop, inverse: noop })
    assert.throws(() => undo.undo(), {
      message: 'undefined command'
    })
  })

  it('enforces undo limit (32 commands)', function () {
    let count = 0
    const command = {
      apply: () => (count += 1),
      inverse: () => command
    }

    R.range(0, 100).forEach(() => undo.push(command))
    R.range(0, 100).forEach(() => undo.undo())
    assert.strictEqual(count, 32)
  })

  it('undo/redo sequence behaves as expected', function () {
    let color = 'gray'
    const command = next => ({
      apply: () => (color = next),
      inverse: () => command(next === 'red' ? 'green' : 'red')
    })

    undo.push(command('red'))
    R.range(0, 10).forEach(() => {
      undo.undo(); assert.strictEqual(color, 'red')
      undo.redo(); assert.strictEqual(color, 'green')
    })
  })
})

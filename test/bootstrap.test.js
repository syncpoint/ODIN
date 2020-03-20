import hooks from './hooks'
import assert from 'assert'

describe('Bootstrap', function () {
  let app
  this.timeout(10000)

  before(async () => {
    app = await hooks.startApp()
  })

  after(async () => {
    await hooks.stopApp(app)
  })

  it('opens a window', async function () {
    const count = await app.client.waitUntilWindowLoaded()
      .getWindowCount()
    assert.equal(count, 1)
  })
})
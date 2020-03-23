import hooks from './hooks'
import assert from 'assert'

describe('Bootstrap', function () {
  let app
  this.timeout(30000)

  before(async () => {
    app = await hooks.startApp()
  })

  after(async () => {
    await hooks.stopApp(app)
  })

  it('starts the application', async function () {
    const count = await app.client.waitUntilWindowLoaded()
      .getWindowCount()
    assert.equal(count, 1)
  })
})

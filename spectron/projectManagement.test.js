import hooks from './hooks'


describe('menu test', function () {
  let app
  this.timeout(10000)

  before(async function () {
    app = await hooks.startApp()
  })

  after(async () => {
    await hooks.stopApp(app)
  })

  it('opens project manager', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
  })

})

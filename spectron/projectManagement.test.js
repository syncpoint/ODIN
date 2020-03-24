import hooks from './hooks'
import { clickElementById } from './UiHelper'
import assert from 'assert'

describe.only('menu test', function () {
  let app
  this.timeout(10000)

  const newProjectName = 'Test Project ' + Date.now()
  const untitledProject = 'untitled project'
  const currentProject = 'current'

  before(async function () {
    app = await hooks.startApp()
  })

  after(async () => {
    await hooks.stopApp(app)
  })

  it('opens project manager', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await clickElementById(app, '#backToMap')
  })

  it('rename current project', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await clickElementById(app, '#projectName')
    await app.client.$('#projectName').setValue(currentProject)
    assert.equal(await app.client.$('#projectName').getValue(), currentProject)
    await clickElementById(app, '#saveProject')
    await clickElementById(app, '#backToMap')
  })

  // TODO: more verifications
  it('creates a new project', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await clickElementById(app, '#newProject')
    await clickElementById(app, `//*[text() = "${untitledProject}"]`)
    await clickElementById(app, '#projectName')
    await app.client.$('#projectName').setValue(newProjectName)
    assert.equal(await app.client.$('#projectName').getValue(), newProjectName)
    await clickElementById(app, '#saveProject')
    await clickElementById(app, '#backToMap')

  })

  // TODO: add verification
  it('deletes the project', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await clickElementById(app, `//*[text() = "${currentProject}"]`)
    await clickElementById(app, '#deleteProject')
    await clickElementById(app, '#backToMap')
  })
})

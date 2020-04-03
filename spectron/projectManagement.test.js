import hooks from './hooks'
import { clickElementById } from './UiHelper'
import assert from 'assert'
import projects from '../src/shared/projects'
import path from 'path'

describe('menu test', function () {
  let app
  this.timeout(10000)

  const newProjectName = 'Test_Project'
  const currentProject = 'current'
  const emptyTestProject = 'EmptyProject'

  const createProject = async (name) => {
    await clickElementById(app, '#newProject')
    await clickElementById(app, '#projectName')
    await app.client.$('#projectName').setValue(name)
    assert.equal(await app.client.$('#projectName').getValue(), name)
    await clickElementById(app, '#saveProject')
  }

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

  it('creates a new project', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await createProject(newProjectName)
    await clickElementById(app, '#backToMap')
  })

  it('rename test project to current project', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await clickElementById(app, '#projectName')
    await app.client.$('#projectName').setValue(currentProject)
    assert.equal(await app.client.$('#projectName').getValue(), currentProject)
    await clickElementById(app, '#saveProject')
    await clickElementById(app, '#backToMap')
  })

  it('deletes the project', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    await clickElementById(app, `//*[text() = "${currentProject}"]`)
    await clickElementById(app, '#deleteProject')
    await clickElementById(app, '#backToMap')
  })

  it('imports the test project and switches to it', async function () {
    app.browserWindow.send('IPC_SHOW_PROJECT_MANAGEMENT')
    const projectPath = path.join(__dirname, '/test_projects/EmptyProject.odin')
    await projects.importProject(projectPath)
    await clickElementById(app, '#switchTo' + emptyTestProject)
  })

})

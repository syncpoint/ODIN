import path from 'path'
import projects from '../../src/shared/projects'
import assert from 'assert'
import 'mocha'


describe('In order to support SNAP packages', () => {

  const v7Path = '/homes/user/snap/odin-c2is/7/ODIN'
  const v8Path = '/homes/user/snap/odin-c2is/8/ODIN'

  it('should return the updated project path', () => {

    const v7ProjectPath = path.join(v7Path, 'projects', 'TEST')
    const projectId = path.basename(v7ProjectPath)

    process.env.ODIN_HOME = v8Path
    const calculatedPathFromId = projects.pathFromId(projectId)
    assert.strictEqual(calculatedPathFromId, path.join(v8Path, 'projects', 'TEST'))
  })
})


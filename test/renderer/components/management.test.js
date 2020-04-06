import Management from '../../../src/renderer/components/Management'
import React from 'react'
import assert from 'assert'
import sinon from 'sinon'

/* eslint-disable no-undef */
describe('Management', () => {
  const clickCallback = sinon.spy()
  const wrapper = shallow(<Management currentProjectPath={''} onCloseClicked={clickCallback} />)

  it('verify project management components', () => {
    assert(wrapper.find('projects'), true, 'no projects area')
    assert(wrapper.find('projectList'), true, 'no project list')
    assert(wrapper.find('projectActions'), true, 'no project actions')
    assert(wrapper.find('details'), true, 'no project details')
    assert(wrapper.find('preview'), true, 'no project preview')
    assert(wrapper.find('projectSettings'), true, 'no projectSettings')
    assert(wrapper.find('dangerousActions'), true, 'no project dangerousActions')
  })

  it('verify back to map button is clicked', () => {
    wrapper.find('#backToMap').simulate('click')
    sinon.assert.called(clickCallback)

  })
})


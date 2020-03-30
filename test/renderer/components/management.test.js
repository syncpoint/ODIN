import Management from '../../../src/renderer/components/Management'
import { Button } from '@material-ui/core'
import ImportProjectIcon from '@material-ui/icons/LibraryAdd'
import React from 'react'
import assert from 'assert'
import sinon from 'sinon'

/* eslint-disable no-undef */
describe('Management', () => {
  const clickCallback = sinon.spy()
  const wrapper = shallow(<Management currentProjectPath={''} onCloseClicked={clickCallback} />)
  it('verify import button', () => {
    assert(wrapper.containsMatchingElement(<Button id="importProject" variant="outlined" color="primary"
      style={{ float: 'right', marginRight: '1em', marginLeft: '2px' }}
      startIcon={<ImportProjectIcon />} >
      Import
    </Button>), true, 'Verify import button')
  })

  it('verify back to map button is clicked', () => {
    wrapper.find('#backToMap').simulate('click')
    sinon.assert.called(clickCallback)

  })
})


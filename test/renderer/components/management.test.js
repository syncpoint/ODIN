/* eslint-disable no-undef */
import Management from '../../../src/renderer/components/Management'
import { Button } from '@material-ui/core'
import ImportProjectIcon from '@material-ui/icons/LibraryAdd'
import React from 'react'
import assert from 'assert'

describe('Management', () => {
  it('verify import button', () => {
    const wrapper = shallow(<Management currentProjectPath={''} onCloseClicked={() => { }} />)
    assert(wrapper.containsMatchingElement(<Button id="importProject" variant="outlined" color="primary" 
                                      style={{ float: 'right', marginRight: '1em', marginLeft: '2px' }}
                                      startIcon={<ImportProjectIcon />} disabled={true} >
                                      Import
                                      </Button>), true, 'Verify import button')
  })
})

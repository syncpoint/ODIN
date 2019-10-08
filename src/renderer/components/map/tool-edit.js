import selection from '../App.selection'

/**
 * Edit Tool.
 */
export default map => editor => {
  const dispose = () => editor.dispose()
  const handle = event => {
    switch (event.type) {
      case 'keydown:escape': return map.tools.dispose()
      case 'click': return selection.deselect()
      case 'deselected':
      case 'keydown:return': return map.tools.dispose()
    }
  }

  return { name: 'edit', handle, dispose }
}

import Mousetrap from 'mousetrap'
import selection from './App.selection'

Mousetrap.bind(['mod+c'], () => {
  console.log(selection.selected())
})

Mousetrap.bind(['mod+x'], event => console.log('CUT', event))
Mousetrap.bind(['mod+v'], event => console.log('PASTE', event))
Mousetrap.bind(['mod+z'], event => console.log('UNDO', event))
Mousetrap.bind(['mod+shift+z'], event => console.log('REDO', event))

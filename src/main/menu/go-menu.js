import { sendMessage } from './ipc'

export default {
  label: 'Go',
  submenu: [
    {
      label: 'Add bookmark',
      accelerator: 'CmdOrCtrl+B',
      click: sendMessage('COMMAND_ADD_BOOKMARK')
    },
    {
      label: 'Find ...',
      accelerator: 'CmdOrCtrl+F',
      click: sendMessage('COMMAND_GOTO_PLACE')
    }
  ]
}

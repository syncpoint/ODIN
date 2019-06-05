import { sendMessage } from './ipc'

export default {
  label: 'Go',
  submenu: [
    {
      label: 'Find',
      accelerator: 'CmdOrCtrl+F',
      click: sendMessage('COMMAND_GOTO_PLACE')
    }
  ]
}

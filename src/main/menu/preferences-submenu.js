import { sendMessage } from './ipc'

export default {
  label: 'Preferences',
  submenu: [
    {
      label: 'Coordinate format',
      submenu: [
        {
          label: 'Sexagesimal - 40°26′46″N 79°58′56″W',
          click: sendMessage('COMMAND_COORD_FORMAT', 'dms')
        },
        {
          label: 'Degrees/decimal minutes - 40°26.767′N 79°58.933′W',
          click: sendMessage('COMMAND_COORD_FORMAT', 'dm')
        },
        {
          label: 'Decimal degrees - 40.446° N 79.982° W',
          click: sendMessage('COMMAND_COORD_FORMAT', 'd')
        },
        {
          label: 'UTM - 32U 461344 5481745',
          click: sendMessage('COMMAND_COORD_FORMAT', 'utm')
        },
        {
          label: 'MGRS - 32U MV 61344 81745',
          click: sendMessage('COMMAND_COORD_FORMAT', 'mgrs')
        }
      ]
    }
  ]
}

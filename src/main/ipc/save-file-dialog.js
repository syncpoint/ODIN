import { dialog, Notification, shell } from 'electron'
import i18n from '../../i18n'

export default (parentWindow, dialogOptions, action) => {
  dialog.showSaveDialog(parentWindow, dialogOptions).then(async result => {
    if (result.canceled) return
    try {
      await action(result.filePath)
      const n = new Notification({
        title: i18n.t('export.succeeded'),
        body: i18n.t('export.clickToOpen', { path: result.filePath })
      })
      n.once('click', () => {
        shell.showItemInFolder(result.filePath)
      })
      n.show()
    } catch (error) {
      const n = new Notification({
        title: i18n.t('export.failed'),
        body: error.message
      })
      n.show()
    }
  })
}

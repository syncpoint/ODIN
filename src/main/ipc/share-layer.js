import { dialog, Notification, shell } from 'electron'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs'
import i18n from '../../i18n'


export const exportLayer = (event, name, contents) => {
  const filenameSuggestion = sanitizeFilename(`${name}.json`)
  const dialogOptions = {
    title: i18n.t('export.title', { name: name }),
    defaultPath: filenameSuggestion,
    filters: [{ name: 'Layer', extensions: ['json'] }]
  }

  dialog.showSaveDialog(event.sender.getOwnerBrowserWindow(), dialogOptions).then(async result => {
    if (result.canceled) return
    try {
      await fs.promises.writeFile(result.filePath, JSON.stringify(contents))
      const n = new Notification({
        title: i18n.t('export.succeeded', { name: name }),
        body: i18n.t('export.clickToOpen', { path: result.filePath })
      })
      n.once('click', () => {
        shell.showItemInFolder(result.filePath)
      })
      n.show()
    } catch (error) {
      const n = new Notification({
        title: i18n.t('export.failed', { name: name }),
        body: error.message
      })
      n.show()
    }
  })
}

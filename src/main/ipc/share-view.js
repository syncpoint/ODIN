import { dialog, Notification, shell } from 'electron'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs'
import projects from '../../shared/projects'
import i18n from '../../i18n'

export const viewAsPng = async (event, pngImageData) => {
  const sender = event.sender.getOwnerBrowserWindow()
  if (!sender.path) return
  const project = await projects.readMetadata(sender.path)
  const filenameSuggestion = sanitizeFilename(project.metadata.name)
  const dialogOptions = {
    defaultPath: filenameSuggestion,
    filters: [
      { name: 'png', extensions: ['png'] }
    ]
  }
  /* providing getOwnerBrowserWindow creates a modal dialog */
  dialog.showSaveDialog(event.sender.getOwnerBrowserWindow(), dialogOptions).then(async result => {
    if (result.canceled) return
    try {
      await fs.promises.writeFile(result.filePath, pngImageData, { encoding: 'base64' })
      const n = new Notification({
        title: i18n.t('export.succeeded', { name: project.metadata.name }),
        body: i18n.t('export.clickToOpen', { path: result.filePath })
      })
      n.on('click', () => {
        shell.showItemInFolder(result.filePath)
      })
      n.show()
    } catch (error) {
      const n = new Notification({
        title: i18n.t('export.failed', { name: project.metadata.title }),
        body: error.message
      })
      n.show()
    }
  })
}

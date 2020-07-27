import { dialog, Notification } from 'electron'
import sanitizeFilename from 'sanitize-filename'
import projects from '../../shared/projects'
import saveFileDialog from './save-file-dialog'
import i18n from '../../i18n'

export const exportProject = async (event, projectPath) => {
  const project = await projects.readMetadata(projectPath)
  const filenameSuggestion = sanitizeFilename(`${project.metadata.name}.odin`)
  const dialogOptions = {
    title: i18n.t('exportProject.title', { name: project.metadata.name }),
    defaultPath: filenameSuggestion,
    filters: [{ name: i18n.t('importProject.fileFilterName'), extensions: ['odin'] }]
  }

  const action = async (targetPath) => await projects.exportProject(projectPath, targetPath)
  saveFileDialog(event.sender.getOwnerBrowserWindow(), dialogOptions, action)
}

export const importProject = async (event) => {
  const dialogOptions = {
    title: i18n.t('importProject.title'),
    filters: [{ name: i18n.t('importProject.fileFilterName'), extensions: ['odin'] }],
    properties: ['openFile']
  }

  dialog.showOpenDialog(event.sender.getOwnerBrowserWindow(), dialogOptions).then(async result => {
    if (result.canceled) return
    /*
      Result contains an array of filePath but since we limited the dialog
      to select only one file we can just take the first item of the array
    */
    try {
      await projects.importProject(result.filePaths[0])
      event.reply('IPC_PROJECT_IMPORTED')

      if (!Notification.isSupported()) return
      const n = new Notification({
        title: i18n.t('importProject.succeeded')
      })
      n.show()
    } catch (error) {
      const n = new Notification({
        title: i18n.t('importProject.failed', { path: result.filePaths[0] }),
        body: error.message
      })
      n.show()
    }
  })
}

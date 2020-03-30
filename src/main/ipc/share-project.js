import { dialog, Notification, shell } from 'electron'
import sanitizeFilename from 'sanitize-filename'
import projects from '../../shared/projects'

export const exportProject = async (event, projectPath) => {
  const project = await projects.readMetadata(projectPath)
  const filenameSuggestion = sanitizeFilename(`${project.metadata.name}.odin`)
  const dialogOptions = {
    title: `Export Project ${project.metadata.name}`,
    defaultPath: filenameSuggestion
  }
  /* providing getOwnerBrowserWindow creates a modal dialog */
  dialog.showSaveDialog(event.sender.getOwnerBrowserWindow(), dialogOptions)
    .then(async result => {
      if (result.canceled) return
      try {
        await projects.exportProject(projectPath, result.filePath)
        if (!Notification.isSupported()) return
        const n = new Notification({
          title: `Export of ${project.metadata.name} succeeded`,
          body: `Click to open ${result.filePath}`
        })
        n.on('click', () => {
          shell.showItemInFolder(result.filePath)
        })
        n.show()
      } catch (error) {
        const n = new Notification({
          title: `Export of ${project.metadata.name} failed`,
          body: error.message
        })
        n.show()
      }
    })
}

export const importProject = async (event) => {
  const dialogOptions = {
    title: 'Choose ODIN project to import',
    filters: [{ name: 'ODIN project archives', extensions: ['odin'] }],
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
      if (!Notification.isSupported()) return
      const n = new Notification({
        title: 'Import succeeded'
      })
      n.show()
      event.reply('IPC_PROJECT_IMPORTED')
    } catch (error) {
      const n = new Notification({
        title: `Import of ${result.filePaths[0]} failed`,
        body: error.message
      })
      n.show()
    }
  })
}

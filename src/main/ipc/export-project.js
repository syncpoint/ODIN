import projects from '../../shared/projects'
import { dialog, Notification, shell } from 'electron'
import sanitizeFilename from 'sanitize-filename'

export default async (event, projectPath) => {
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

import projects from '../../shared/projects'

export default async (event, projectPath) => {
  const sender = event.sender.getOwnerBrowserWindow()
  try {
    const nativeImage = await sender.webContents.capturePage()
    projects.writePreview(projectPath, nativeImage.toJPEG(75))
  } catch (error) {
    console.dir(error)
  }
}
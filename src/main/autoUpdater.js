import { dialog, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'
import i18n from '../i18n'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

/* updateInfo is only valid for generic and github providers */
autoUpdater.on('update-available', updateInfo => {

  const message =
    `${i18n.t('autoUpdater.versionMessage',
      {
        currentVersion: autoUpdater ? autoUpdater.currentVersion.version : '',
        newVersion: updateInfo.version
      })} ${i18n.t('autoUpdater.updateMessage')}
    `

  dialog.showMessageBox(null, {
    type: 'info',
    buttons: [i18n.t('autoUpdater.buttons.updateNow'), i18n.t('autoUpdater.buttons.skipUpdate')],
    title: i18n.t('autoUpdater.updateTitle'),
    message: message,
    cancelId: 1
  }).then(({ response }) => {
    // index of clicked button
    if (response === 0) {
      autoUpdater.downloadUpdate()
    }
  }).catch(error => console.error(error))
})

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

autoUpdater.on('download-progress', progress => console.dir(progress))

autoUpdater.on('error', (error) => {
  const errorNotification = new Notification({
    title: 'Updater error',
    body: error.message
  })
  errorNotification.show()
})

export default autoUpdater

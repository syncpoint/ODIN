import { dialog, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'
import settings from 'electron-settings'
import i18n from '../i18n'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

/* updateInfo is only valid for generic and github providers */
autoUpdater.on('update-available', updateInfo => {

  const message =
    `${i18n.t('autoUpdate.versionMessage',
      {
        currentVersion: autoUpdater ? autoUpdater.currentVersion.version : '',
        newVersion: updateInfo.version
      })} ${i18n.t('autoUpdate.updateMessage')}
    `

  dialog.showMessageBox(null, {
    type: 'info',
    buttons: [i18n.t('autoUpdate.buttons.updateNow'), i18n.t('autoUpdate.buttons.skipUpdate')],
    title: i18n.t('autoUpdate.updateTitle'),
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
    title: i18n.t('autoUpdate.error'),
    body: error.message
  })
  errorNotification.show()
})

let checkForUpdatesTimer

const checkForUpdates = () => {
  checkForUpdatesTimer = setTimeout(() => {
    autoUpdater.checkForUpdates().catch(error => console.error(error))
  }, 30000)
}

const cancel = () => {
  if (checkForUpdatesTimer) {
    clearTimeout(checkForUpdatesTimer)
  }
}

const autoUpdate = {
  isEnabled: () => settings.get('autoUpdate', true),
  setEnabled: value => {
    settings.set('autoUpdate', value)
    if (value) {
      checkForUpdates()
    } else {
      cancel()
    }
  },
  checkForUpdates: () => { if (autoUpdate.isEnabled()) { checkForUpdates() } },
  cancel: cancel
}

export default autoUpdate

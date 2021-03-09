import URL from 'url'
import { accessSync, constants, statSync } from 'fs'
import { dialog, Notification, shell } from 'electron'
import i18n from '../i18n'

let ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS = true

const openExternal = url => {
  setImmediate(() => {
    shell.openExternal(url)
      .then(
        new Notification({
          title: i18n.t('navigationEvent.succeeded'),
          body: URL.fileURLToPath(url)
        }).show()
      )
      .catch(error => {
        new Notification({
          title: i18n.t('navigationEvent.failed'),
          body: `${URL.fileURLToPath(url)} : ${error.message}`
        }).show()
      })
  })
}

export const handleNavigationEvent = (navigationEvent, navigationUrl) => {

  const platformSpecificPath = URL.fileURLToPath(navigationUrl)
  try {
    const candidateUrl = new URL.URL(navigationUrl)
    if (candidateUrl.hostname === 'localhost') return

    /* prevent links from beeing opened */
    navigationEvent.preventDefault()

    /* SHAME ON MS WINDOWS

    The same old story: using MS Windows ALL files seem to be
      executable :-( So the following code is kinda useless
      since it prevents ANY file from being opened

    if (candidateUrl.protocol === 'file:') {
      // If the target is a file we need to check if it's executable.
      // If so, we do not open it.
      const fsStats = statSync(platformSpecificPath, { throwIfNoEntry: false })
      if (fsStats && !fsStats.isDirectory()) {
        try {
          accessSync(platformSpecificPath, constants.X_OK)
          //  if the file is executable ==> there IS NO error
          //    we'll consider it to be UNSAFE
          new Notification({
            title: i18n.t('navigationEvent.harmful.title'),
            subtitle: i18n.t('navigationEvent.harmful.subtitle'),
            body: platformSpecificPath
          }).show()
          return
        } catch (accessError) {
          // intentionally ignored
        }
      }
    }
    */

    if (!ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS) {
      openExternal(candidateUrl.href)
    } else {
      dialog.showMessageBox(null, {
        type: 'info',
        buttons: [i18n.t('navigationEvent.ask.decline'), i18n.t('navigationEvent.ask.permit')],
        message: i18n.t('navigationEvent.ask.question'),
        detail: platformSpecificPath,
        defaultId: 1,
        cancelId: 0,
        checkboxLabel: i18n.t('navigationEvent.ask.permitUntilRestart')
      }).then(result => {
        if (result.checkboxChecked) ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS = false
        if (result.response === 1) openExternal(candidateUrl.href)
      })
    }

  } catch (error) {
    new Notification({
      title: i18n.t('navigationEvent.failed'),
      body: error.message
    }).show()
  }
}

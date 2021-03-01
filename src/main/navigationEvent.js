import URL from 'url'
import { accessSync, constants, statSync } from 'fs'
import { dialog, Notification, shell } from 'electron'
import i18n from '../i18n'

const ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS = true

const openExternal = url => {
  setImmediate(() => {
    shell.openExternal(url).catch(error => {
      new Notification({
        title: i18n.t('navigationEvent.failed'),
        body: `${url} : ${error.message}`
      }).show()
    })
  })
  new Notification({
    title: i18n.t('navigationEvent.succeeded'),
    body: url
  }).show()
}

export const handleNavigationEvent = (navigationEvent, navigationUrl) => {

  try {
    const candidateUrl = new URL.URL(navigationUrl)
    if (candidateUrl.hostname === 'localhost') return

    /* prevent executables from beeing opened */
    navigationEvent.preventDefault()

    if (candidateUrl.protocol === 'file:') {
      /*
        If the target is a file we need to check if it's executable.
        If so, we do not open it.
      */
      const fsStats = statSync(candidateUrl.pathname, { throwIfNoEntry: false })
      if (fsStats && !fsStats.isDirectory()) {
        try {
          accessSync(candidateUrl.pathname, constants.X_OK)
          /*  if the file is executable ==> there IS NO error
              we'll consider it to be UNSAFE
          */
          new Notification({
            title: i18n.t('navigationEvent.harmful.title'),
            subtitle: i18n.t('navigationEvent.harmful.subtitle'),
            body: navigationUrl
          }).show()
          return
        } catch (accessError) {
          /* intentionally ignored */
        }
      }
    }

    if (!ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS) {
      openExternal(navigationUrl)
    } else {
      dialog.showMessageBox(null, {
        type: 'info',
        buttons: [i18n.t('navigationEvent.ask.decline'), i18n.t('navigationEvent.ask.permit')],
        message: i18n.t('navigationEvent.ask.question'),
        detail: navigationUrl,
        defaultId: 1,
        cancelId: 0
      }).then(result => {
        if (result.response === 1) openExternal(navigationUrl)
      })
    }

  } catch (error) {
    new Notification({
      title: i18n.t('navigationEvent.failed'),
      body: error.message
    }).show()
  }
}

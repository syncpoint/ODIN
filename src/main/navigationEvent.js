import URL from 'url'
import { dialog, Notification, shell } from 'electron'
import i18n from '../i18n'

let ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS = true

const openExternal = url => {
  const open = (url.protocol === 'file:') ? shell.openPath : shell.openExternal
  const target = (url.protocol === 'file:') ? URL.fileURLToPath(url.href) : url.href
  open(target)
    .then(
      new Notification({
        title: i18n.t('navigationEvent.succeeded'),
        body: target
      }).show()
    )
    .catch(error => {
      console.error(error)
      new Notification({
        title: i18n.t('navigationEvent.failed'),
        body: `${target} : ${error.message}`
      }).show()
    })
}

export const handleNavigationEvent = (navigationEvent, navigationUrl) => {

  try {
    const candidateUrl = new URL.URL(navigationUrl)
    if (candidateUrl.hostname === 'localhost') return

    /* prevent links from beeing opened */
    navigationEvent.preventDefault()

    if (!ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS) {
      openExternal(candidateUrl)
    } else {
      dialog.showMessageBox(null, {
        type: 'info',
        buttons: [i18n.t('navigationEvent.ask.decline'), i18n.t('navigationEvent.ask.permit')],
        message: i18n.t('navigationEvent.ask.question'),
        detail: (candidateUrl.protocol === 'file:') ? URL.fileURLToPath(candidateUrl.href) : candidateUrl.href,
        defaultId: 1,
        cancelId: 0,
        checkboxLabel: i18n.t('navigationEvent.ask.permitUntilRestart')
      }).then(result => {
        if (result.checkboxChecked) ASK_FOR_PERMISSION_TO_OPEN_EXTERNAL_URLS = false
        if (result.response === 1) openExternal(candidateUrl)
      })
    }

  } catch (error) {
    console.error(error)
    new Notification({
      title: i18n.t('navigationEvent.failed'),
      body: error.message
    }).show()
  }
}

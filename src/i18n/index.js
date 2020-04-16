import i18next from 'i18next'
import i18nConfig from './i18next.config'

/*
  Using the setTimeout workaround makes sure that event listeners are
  able to register for the appropriate events.
*/
if (!i18next.isInitialized) {
  setTimeout(() => {

    if (process.env.NODE_ENV !== 'production') {
      i18next.on('missingKey', (lng, namespace, key) => {
        console.log(`i18n missing key for ${lng} in namespace ${namespace}: ${key}`)
      })
    }

    i18next.init(i18nConfig)
  }, 0)
}

export default i18next
export const languageKey = 'ODIN.language'

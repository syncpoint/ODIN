import i18next from 'i18next'
import i18nConfig from './i18next.config'

/*
  Using the setTimeout workaround makes sure that event listeners are
  able to register for the appropriate events.
*/
if (!i18next.isInitialized) setTimeout(() => i18next.init(i18nConfig), 0)

export default i18next

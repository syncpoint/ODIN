import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ipcRenderer } from 'electron'

const DEFAULT_I18N_NAMESPACE = 'web'

const addResourceBundle = i18nInfo => {
  if (!i18n.hasResourceBundle(i18nInfo.lng, DEFAULT_I18N_NAMESPACE)) {
    i18n.addResourceBundle(i18nInfo.lng, DEFAULT_I18N_NAMESPACE, i18nInfo.resourceBundle)
  }
}

const applyLanguageSelection = i18nInfo => {
  addResourceBundle(i18nInfo)
  i18n.changeLanguage(i18nInfo.lng)
}

i18n.use(initReactI18next)
i18n.init({ defaultNS: DEFAULT_I18N_NAMESPACE }).then(() => {
  /*  Changes the i18n settings whenever the user switches between supported languages */
  const handleLanguageChanged = (_, i18nInfo) => {
    applyLanguageSelection(i18nInfo)
  }
  ipcRenderer.on('IPC_LANGUAGE_CHANGED', handleLanguageChanged)
})

export default i18n

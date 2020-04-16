import german from './de'
import english from './en'

const i18nextOptions = {
  debug: false,
  resources: {
    en: english,
    de: german
  },
  interpolation: {
    escapeValue: false
  },
  saveMissing: true,
  fallbackLng: 'en',
  ns: ['electron', 'web'],
  defaultNS: 'electron',
  react: {
    wait: false
  }
}

export default i18nextOptions

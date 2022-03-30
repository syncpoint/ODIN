import german from './de'
import english from './en'
import french from './fr'

const i18nextOptions = {
  debug: false,
  resources: {
    en: english,
    de: german,
    fr: french,
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

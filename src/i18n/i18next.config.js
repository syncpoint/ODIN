import german from './de'
import english from './en'
import french from './fr'
import spanish from './sp'

const i18nextOptions = {
  debug: false,
  resources: {
    en: english,
    de: german,
    fr: french,
	sp: spanish,
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

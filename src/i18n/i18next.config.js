import electronDE from './de/electron.json'
import electronEN from './en/electron.json'

const i18nextOptions = {
  debug: false,
  resources: {
    en: { electron: electronEN },
    de: { electron: electronDE }
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

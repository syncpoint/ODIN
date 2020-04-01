const languageMenu = i18n => {
  return {
    label: i18n.t('Language'),
    submenu: ['de', 'en'].map((languageCode) => {
      return {
        label: i18n.t(languageCode),
        type: 'radio',
        checked: i18n.language === languageCode,
        click: () => {
          i18n.changeLanguage(languageCode)
        }
      }
    })
  }
}

export default languageMenu

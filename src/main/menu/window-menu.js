const menu = i18n => {
  const m = {
    role: 'window',
    label: i18n.t('window.name'),
    submenu: [
      { role: 'minimize', label: i18n.t('window.minimize') },
      { role: 'close', label: i18n.t('window.close') }
    ]
  }

  if (process.platform === 'darwin') {
    m.submenu = [
      { role: 'close', label: i18n.t('window.close') },
      { role: 'minimize', label: i18n.t('window.minimize') },
      { role: 'zoom', label: i18n.t('window.zoom') }
    ]
  }

  return m
}

export default menu

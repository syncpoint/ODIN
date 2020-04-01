
const menu = i18n => {

  return {
    label: i18n.t('view.name'),
    submenu: [
      { role: 'reload', label: i18n.t('view.reload') },
      { role: 'forcereload', label: i18n.t('view.forceReload') },
      { role: 'toggledevtools', label: i18n.t('view.toggleDevTools') },
      { type: 'separator' },
      { role: 'resetzoom', label: i18n.t('view.resetZoom') },
      { role: 'zoomin', label: i18n.t('view.zoomIn') },
      { role: 'zoomout', label: i18n.t('view.zoomOut') },
      { type: 'separator' },
      { role: 'togglefullscreen', label: i18n.t('view.toggleFullscreen') }
    ]
  }
}

export default menu

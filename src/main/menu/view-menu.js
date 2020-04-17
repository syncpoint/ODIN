
const onclick = fn => (_, browserWindow) => {
  if (browserWindow) fn(browserWindow)
}

const menu = (i18n, args) => {

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
      {
        role: 'none',
        type: 'radio',
        checked: args ? args.grid === undefined : true,
        label: i18n.t('view.grid.none'),
        click: onclick(browserWindow => browserWindow.send('grid', undefined))
      },
      {
        role: 'mgrs',
        type: 'radio',
        checked: args ? args.grid === 'mgrs' : false,
        label: i18n.t('view.grid.mgrs'),
        click: onclick(browserWindow => browserWindow.send('grid', 'mgrs'))
      },
      { type: 'separator' },
      { role: 'togglefullscreen', label: i18n.t('view.toggleFullscreen') }
    ]
  }
}

export default menu

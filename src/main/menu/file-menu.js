const menu = () => {

  if (process.platform !== 'darwin') {
    menu.submenu.push({ type: 'separator' })
    menu.submenu.push({ role: 'quit' })
  }

  return menu
}

export default menu

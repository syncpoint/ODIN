
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs'
import i18n from '../../i18n'
import saveFileDialog from './save-file-dialog'

export const exportLayer = (event, name, contents) => {
  const filenameSuggestion = sanitizeFilename(`${name}.json`)
  const dialogOptions = {
    title: i18n.t('export.title', { name: name }),
    defaultPath: filenameSuggestion,
    filters: [{ name: 'Layer', extensions: ['json'] }]
  }
  const action = async (targetPath) => fs.promises.writeFile(targetPath, JSON.stringify(contents))

  saveFileDialog(event.sender.getOwnerBrowserWindow(), dialogOptions, action)
}

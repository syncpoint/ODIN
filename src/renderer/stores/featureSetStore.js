import path from 'path'
import { remote } from 'electron'
import fs from 'fs'

const featureSetData = () => {
  const { app } = remote
  const filename = path.join(app.getAppPath(), 'feature-sets.json')
  return JSON.parse(fs.readFileSync(filename, 'utf8'))
}

export default featureSetData

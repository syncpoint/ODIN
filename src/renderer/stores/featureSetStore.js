import path from 'path'
import { remote } from 'electron'

const xlsx = require('node-xlsx')

const featureSetData = () => {
  const { app } = remote
  const filename = path.join(app.getAppPath(), 'feature-sets.xls')

  const worksheets = xlsx.parse(filename)
  const sets = worksheets[0].data.slice(1).reduce((acc, line) => {
    acc[line[0]] = acc[line[0]] || []
    acc[line[0]].push(line[2])
    return acc
  }, [])

  return Object.entries(sets).map(([name, content]) => ({ name, content }))
}

export default featureSetData


const xlsx = require('node-xlsx')

const featureSetData = () => {
  const worksheets = xlsx.parse(`feature-sets.xlsx`)
  const sets = worksheets[0].data.slice(1).reduce((acc, line) => {
    acc[line[0]] = acc[line[0]] || []
    acc[line[0]].push(line[2])
    return acc
  }, [])

  return Object.entries(sets).map(([name, content]) => ({ name, content }))
}

export default featureSetData


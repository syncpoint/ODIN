import level from 'level'
import now from 'nano-time'

const db = level('poi-db', { valueEncoding: 'json' })


db.createReadStream({
  keys: false,
  values: true,
  gt: 'journal:',
  lt: 'snapshot:'
}).on('data', data => {
  console.log(`poi:command=${JSON.stringify(data)}`)
})

const put = event => {
  db.put(`journal:${now()}`, event)
}

const add = poi => put({ command: 'add', poi })
const remove = id => put({ command: 'remove', id })

const poi = {
  add,
  remove
}

export default poi

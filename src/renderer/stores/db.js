import { Writable } from 'stream'
import level from 'level'

export const db = level('db', { valueEncoding: 'json' })

const deleteStream = () => {
  const batch = db.batch()
  return new Writable({
    objectMode: true,
    write (chunk, _, callback) {
      batch.del(chunk)
      callback()
    },
    final (callback) {
      batch.write(callback)
    }
  })
}

// Clear entire database.
export const clear = () => db.createReadStream({ values: false }).pipe(deleteStream())

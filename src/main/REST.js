import { BrowserWindow } from 'electron'
import express from 'express'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/layer/:name', (req, res) => {
  res.end()

  const sendCommand = window =>
    window.webContents.send('COMMAND_LOAD_LAYER', req.params.name, req.body)

  BrowserWindow.getAllWindows().forEach(sendCommand)
})

app.listen(8001, () => {
  console.log('REST server bound', 8001)
})

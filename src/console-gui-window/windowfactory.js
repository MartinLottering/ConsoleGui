const electron = require('electron')

const { BrowserWindow } = electron

const sleep = require('../tools/sleep')

const devMode = false

const window = new BrowserWindow({
  width: devMode ? 1500 : 700,
  height: 850,
  show: devMode,
  resizable: devMode,
  webPreferences: {
    nodeIntegration: true
  }
})

if (!devMode) { window.removeMenu() }
window.loadURL(`file://${__dirname}/window.html`)
if (devMode) { window.openDevTools() }

let closingApp = false

window.on('close', evt => {
  if (!closingApp) {
    evt.preventDefault()
    window.hide()
  }
})

exports.run = async function (args, done) {
  if (!window.isVisible()) { window.show() }
  await sleep(100)
  window.focus()
  await sleep(100)
  window.webContents.send('populate', args)
}

exports.close = function () {
  closingApp = true
  window.close()
}

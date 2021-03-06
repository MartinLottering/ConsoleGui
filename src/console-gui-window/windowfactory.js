const { BrowserWindow } = require('electron')
const path = require('path')

const sleep = require('../tools/sleep')

const devMode = false
const addMenuAnyway = false

const window = new BrowserWindow({
  width: devMode ? 1500 : 1000,
  height: 850,
  show: devMode,
  resizable: devMode,
  webPreferences: {
    nodeIntegration: true
  },
  icon: path.join(__dirname, '..', 'images', 'logo-32x32.png')
})

if (!devMode && !addMenuAnyway) { window.removeMenu() }
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

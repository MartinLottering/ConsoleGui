const { app, Tray } = require('electron')

const path = require('path')
const menuBuilder = require('./menuBuilder')

let tray

app.on('ready', _ => {
  tray = new Tray(path.join(__dirname, 'images', 'logo-16x16.png'))
  const contextMenu = menuBuilder(app, tray)
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Console GUI')
})

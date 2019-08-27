const electron = require('electron')

const { BrowserWindow } = electron

let window = new BrowserWindow({
    width: 1500,
    height: 850,
    //show: false,
    //resizable: false,
    webPreferences: {
        nodeIntegration: true
    }
})

//window.removeMenu()
window.loadURL(`file://${__dirname}/window.html`)
window.openDevTools()

let closingApp = false

window.on('close', evt => {
    if (!closingApp) {
        evt.preventDefault()
        window.hide()
    }
})

exports.run = function (args, done) {
    if (!window.isVisible())
        window.show()
    window.webContents.send('populate', args)
}

exports.close = function () {
    closingApp = true
    window.close()
}

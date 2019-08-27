const electron = require('electron')
const { Menu } = electron
const clisMetaParser = require('./tools/clisMetaParser')

module.exports = function (app, tray) {

    let menuItems = [
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: _ => {
                ConsoleGuiWindow.close()
                tray.destroy()
                app.quit()
            }
        }
    ]

    const ConsoleGuiWindow = require('./console-gui-window/windowfactory')

    const clis = clisMetaParser()
    const cliMenus = clis.getClis().map(cli => {
        return {
            label: cli.name,
            submenu: clis.getCliTemplates(cli.name).map(template => {
                return {
                    label: template.desc,
                    click: _ => ConsoleGuiWindow.run({ cli: cli.name, template: template.desc })
                }
            })
        }
    })

    const fullMenu = cliMenus.concat(menuItems)

    return Menu.buildFromTemplate(fullMenu)
}
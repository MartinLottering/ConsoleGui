const electron = require('electron')
const { Menu } = electron

module.exports = function (app, tray) {

    let menuItems = [
        {
            type: 'separator'
        },
        {
            label: 'Set Batch Permissions',
            click: _ => PermissionsWindow.run()
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: _ => {
                CliWindow.close()
                tray.destroy()
                app.quit()
            }
        }
    ]

    const CliWindow = require('./cliwindow/windowfactory')
    const templates = require('./cliwindow/templates')
    const templateMenuItems = templates.map(template => { 
        return {
            "label": template.desc || "<Unknown>",
            click: _ => CliWindow.run(template)
        }
    });
    const fullMenu = templateMenuItems.concat(menuItems);

    return Menu.buildFromTemplate(fullMenu)
}
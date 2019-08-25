const electron = require('electron')
const { ipcRenderer: ipc } = electron
const templates = require('./templates')
const child_process = require('child_process')
const clisMetaParser = require('../tools/clisMetaParser')

function initialize() {
    /* keep first while all the controls are visible briefly */

    questionEngine.clisMeta = clisMetaParser()
    questionEngine.templates = templates
    questionEngine.addEventListener('runClicked', runClicked)

    return

    ipc.on('populate', (evt, templateArg) => selectTemplate(templateArg.desc))

    tokenPackage.addEventListener('keyup', evt => buildPreview())

    template.addEventListener('change', _ => {
        const templateOption = template.options[template.options.selectedIndex]
        selectTemplate(templateOption.text)
        showFields()
    })

    showFields()
}

function runClicked(evt) {
    start(evt.detail)
}

function cancelRun() {
    child = null
    questionEngine.disabled = false
}

let child

function start(startInfo) {
    output.lines = [`${startInfo.processName} ${startInfo.args.join(' ')}`]

    child = child_process.spawn(startInfo.processName, startInfo.args)

    child.on('error', addOutput)
    child.on('message', addOutput)
    child.on('close', (code, signal) => {
        addOutput('Process closed')
        cancelRun()
    })

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', addOutput)

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', addOutput)
    child.on('exit', (code, signal) => {
        addOutput(`Exited with ${code}`)
        cancelRun()
    })
}

function addOutput(newLine) {
    output.lines = output.lines.concat(['\n', newLine])
}

initialize();
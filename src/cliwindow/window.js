const child_process = require('child_process')
const clisMetaParser = require('../tools/clisMetaParser')

function initialize() {
    questionEngine.clisMeta = clisMetaParser()
    questionEngine.addEventListener('runClicked', runClicked)
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
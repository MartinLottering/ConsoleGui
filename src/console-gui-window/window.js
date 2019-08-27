const childProcess = require('child_process')
const clisMetaParser = require('../tools/clisMetaParser')
const { ipcRenderer: ipc } = require('electron')

function initialize () {
  questionEngine.clisMeta = clisMetaParser()
  questionEngine.addEventListener('runClicked', runClicked)

  ipc.on('populate', async (evt, args) => {
    if (questionEngine.cli !== args.cli) {
      let resolve, reject
      const promise = new Promise((res_, rej_) => {
        resolve = res_
        reject = rej_
      })
      const templatesLoadedHandler = (event) => {
        resolve()
      }
      questionEngine.addEventListener('templatesLoaded', templatesLoadedHandler)
      questionEngine.cli = args.cli
      await promise
      /* we need to render before setting the template */
      await sleep(100)
      questionEngine.removeEventListener('templatesLoaded', templatesLoadedHandler)
    }
    questionEngine.template = args.template
  })
}

function runClicked (evt) {
  start(evt.detail)
}

function cancelRun () {
  child = null
  questionEngine.disabled = false
}

let child

function start (startInfo) {
  output.lines = [`${startInfo.processName} ${startInfo.args.join(' ')}`]

  child = childProcess.spawn(startInfo.processName, startInfo.args)

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

function addOutput (newLine) {
  output.lines = output.lines.concat(['\n', newLine])
}

initialize()

const commandLineBuilder = require('../tools/commandLineBuilder')

const SELECT_A_COMMAND = 'Select a command or template'

function forEach(host, cssSelector, action) {
    const elements = host.shadowRoot.querySelectorAll(cssSelector)
    elements.forEach(action)
}

function setAllElemenetsDisabled(host, disabled) {
    forEach(host, 'input', e => e.disabled = disabled)
    forEach(host, 'select', e => e.disabled = disabled)
    forEach(host, 'button', e => e.disabled = disabled)
}

function runClicked(host, evt) {
    evt.preventDefault()
    const startInfo = commandLineBuilder.getProcessStartInfo(host)
    if (startInfo.processName != SELECT_A_COMMAND
        && startInfo.processName) {
        dispatch(host, 'runClicked', { detail: startInfo })
        host.disabled = true
    }
}

function selectDirectory(name) {
    return function (host, event) {
        event.preventDefault()
        dialog.showOpenDialog({
            title: 'Select Directory',
            properties: ["openDirectory"]
        }).then(result => {
            if (!result.cancelled && result.filePaths[0]) {
                host[name] = result.filePaths[0]
                buildPreview(host)
            }
        })
    }
}

function buildPreview(host) {
    const startInfo = commandLineBuilder.getProcessStartInfo(host)
    host.preview = `${startInfo.processName} ${(startInfo.args || []).join(' ')}`
}

function fieldChanged(host, event) {
    const id = event.target.id
    if (!id)
        throw new Error(`All bound elements must have an id`)
    host[id] = event.target.type == 'checkbox'
        ? event.target.checked
        : event.target.value

    if (id === 'command')
        showFields(host)
    else if (id === 'template')
        selectTemplate(host, event.target.value)

    buildPreview(host)
}

function findTemplateOPTIONUsingDesc(host, desc) {
    for (let i = 0; i < host.templates.length; i++) {
        if (host.templates[i].desc == desc)
            return host.templates[i]
    }
    throw new Error(`Could not find a template with description "${desc}"`)
}

// function selectTemplate(host, templateDesc) {
//     const template = findTemplateOPTIONUsingDesc(host, templateDesc)
//     host.template = template.desc

//     host.command = template.args.command || ''
//     host.job = template.args.job || ''
//     host.package = template.args.package || ''
//     host.from = template.args.from || ''
//     host.to = template.args.to || ''
//     host.timeout = template.args.timeout || '00:30:00'
//     host.overwrite = template.args.overwrite ? true : false
//     host.script = template.args.script || ''
//     host.parameters = template.args.parameters || ''
//     host.environment = template.args.environment || ''
//     host.machine = template.args.machine || ''
//     host.tokenPackage = template.args.tokenPackage

//     showFields(host)

//     if (template.focus)
//         setTimeout(() => {
//             const control = host.shadowRoot.getElementById(template.focus)
//             if (control) {
//                 control.focus()
//                 control.select()
//             }
//         }, 300)
// }

// function showFields(host) {
//     const isCopy = host.command == 'copy'
//     const isExecute = host.command == 'execute'
//     const isPackage = host.command == 'package'
//     const isDeploy = host.command == 'deploy'
//     const isPing = host.command == 'ping'

//     host.showJob = isCopy
//     host.showFrom = isCopy
//     host.showTo = isCopy
//     host.showScript = isExecute
//     host.showParameters = isExecute
//     host.showPackage = isExecute
//     host.showTokenPackage = isExecute || isCopy || isPackage
//     host.showSource = isPackage
//     host.showPurge = isPackage
//     host.showMachine = isDeploy || isPing
//     host.showEnvironment = isDeploy
// }

// function getLineClasses(show) {
//     return {
//         line: true,
//         hidden: !show
//     }
// }

const CliArgumentsQuestionEngine = {
    clisMeta: {},
    cli: "",
    templates: [],
    template: "",
    preview: SELECT_A_COMMAND,

    disabled: {
        get: (host, lastValue) => lastValue,
        set: (host, value, lastValue) => {
            if (value)
                setAllElemenetsDisabled(host, true)
            else
                setAllElemenetsDisabled(host, false)
        }
    },

    render: ({ clisMeta, cli, templates, template, arguments, preview }) => html`

    ${containerStyles}
    ${inputStyles}

    <form onsubmit="${runClicked}">
        <cli-command-preview id="preview" text="${preview}"></cli-command-preview>

        <div class="container" id="container">

            <button type="submit" class="hidden-default-button" aria-hidden="true" tabIndex="-1"></button>

            <div class="line">
                <label for="cli">Cli</label>
                <select id="cli" onchange="${fieldChanged}">
                    <option value=""></option>
                    ${clisMeta.getClis().map(cli => html`<option value="${cli.name}">${cli.name}</option>`)}
                </select>
            </div>

            <div class="line">
                <label for="template">Template</label>
                <select id="template" onchange="${fieldChanged}">
                    <option value=""></option>
                    ${templates.map(template => html`<option value="${template.desc}">${template.desc}</option>`)}
                </select>
            </div>

            ${clisMeta.getCliArguments(cli).map(argument => html`<cli-argument-question argument=${argument}></cli-argument-question>`)}

        </div>

        <div id="buttonsContainer" class="container">
            <button type="submit">Run</button>
        </div>
    </form>
    `
}

define('cli-arguments-question-engine', CliArgumentsQuestionEngine)
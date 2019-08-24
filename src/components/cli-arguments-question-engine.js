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

// function selectDirectory(name) {
//     return function (host, event) {
//         event.preventDefault()
//         dialog.showOpenDialog({
//             title: 'Select Directory',
//             properties: ["openDirectory"]
//         }).then(result => {
//             if (!result.cancelled && result.filePaths[0]) {
//                 host[name] = result.filePaths[0]
//                 buildPreview(host)
//             }
//         })
//     }
// }

function buildPreview(host) {
    const args = {
        arguments: host.clisMeta.getCliArguments(host.cli),
        values: host.values
    }
    const startInfo = commandLineBuilder.getProcessStartInfo(args)
    host.preview = `${startInfo.processName} ${(startInfo.args || []).join(' ')}`
}

// function findTemplateOPTIONUsingDesc(host, desc) {
//     for (let i = 0; i < host.templates.length; i++) {
//         if (host.templates[i].desc == desc)
//             return host.templates[i]
//     }
//     throw new Error(`Could not find a template with description "${desc}"`)
// }

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

// function getLineClasses(show) {
//     return {
//         line: true,
//         hidden: !show
//     }
// }

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function sleep(milliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds)
    })
}

function hideQuestions(questionsToHide) {
    return new Promise(async (resolve, reject) => {
        let count = 0
        if (questionsToHide.length > 0)
            await asyncForEach(questionsToHide.reverse(), async (question) => {
                transition(question, "opacity 1 0 400ms linear", {
                    onTransitionEnd(element, finished) {
                        element.style.display = "none"
                        count++
                        if (count == questionsToHide.length)
                            resolve()
                    }
                })
                await sleep(100)
            })
        else
            resolve()
    })
}

async function showQuestions(questionsToShow) {
    if (questionsToShow.length > 0)
        await asyncForEach(questionsToShow.reverse(), async (question) => {
            question.style.display = "block"
            transition(question, "opacity 0 1 400ms linear", {
                onTransitionEnd(element, finished) {
                }
            })
            await sleep(100)
        })
}

async function showFields(host) {
    const cliArguments = host.clisMeta.getCliArguments(host.cli)
    const questionsToHide = []
    const questionsToShow = []
    for (var cliArgument of cliArguments) {
        const questions = Array.from(host.shadowRoot.querySelectorAll("cli-argument-question"))
        const question = questions.find(q => q.argument === cliArgument)
        if (!question)
            throw new Error(`Couldn't find a question for argument ${cliArgument.name || cliArgument.format || cliArgument.type}`)
        if (cliArgument.showWhens && cliArgument.showWhens.length) {
            let show = false
            for (var showWhen of cliArgument.showWhens) {
                const showWhenArgument = cliArguments.find(a => a.name == showWhen.name)
                if (!showWhenArgument)
                    throw new Error(`Show when rule points to an argument that does not exist: ${showWhen.name}`)
                if (showWhen.is === "anyOf") {
                    var found = false
                    for (var val of showWhen.values) {
                        if (val.value === host.values[showWhen.name]) {
                            found = true
                            break
                        }
                    }
                    if (found) {
                        show = true
                        break
                    }
                }
            }
            const isVisible = question.style.display !== "none"
            if (show && !isVisible)
                questionsToShow.push(question)
            else if (!show && isVisible)
                questionsToHide.push(question)
        }
    }

    await hideQuestions(questionsToHide)
    await showQuestions(questionsToShow)
}

function valueChanged(host, event) {
    if (!host.values)
        host.values = {}
    host.values[event.detail] = event.target.value
    buildPreview(host)
    showFields(host)
}

const CliArgumentsQuestionEngine = {
    clisMeta: {},
    cli: "",
    templates: [],
    template: "",
    preview: SELECT_A_COMMAND,

    questions: children(CliArgumentQuestion),

    values: {},

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
                <select id="cli" onchange="${propertyChanged}">
                    <option value=""></option>
                    ${clisMeta.getClis().map(cli => html`<option value="${cli.name}">${cli.name}</option>`)}
                </select>
            </div>

            <div class="line" style="display: none;">
                <label for="template">Template</label>
                <select id="template" onchange="${propertyChanged}">
                    <option value=""></option>
                    ${templates.map(template => html`<option value="${template.desc}">${template.desc}</option>`)}
                </select>
            </div>

            ${clisMeta.getCliArguments(cli).map(argument => html`<cli-argument-question style="display: block;" argument=${argument} onchanged="${valueChanged}"></cli-argument-question>`)}

        </div>

        <div id="buttonsContainer" class="container">
            <button type="submit">Run</button>
        </div>
    </form>
    `
}

define('cli-arguments-question-engine', CliArgumentsQuestionEngine)
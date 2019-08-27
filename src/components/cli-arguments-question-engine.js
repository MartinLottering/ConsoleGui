const commandLineBuilder = require('../tools/commandLineBuilder')

const SELECT_A_COMMAND = 'Select a command or template'

const FRAME_DELAY = 100
const STEP_DELAY = 50

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
    const args = getCommandLineBuilderArgs(host)
    const startInfo = commandLineBuilder.getProcessStartInfo(args)
    if (startInfo.processName != SELECT_A_COMMAND
        && startInfo.processName) {
        dispatch(host, 'runClicked', { detail: startInfo })
        host.disabled = true
    }
}

function buildPreview(host) {
    const args = getCommandLineBuilderArgs(host)
    const startInfo = commandLineBuilder.getProcessStartInfo(args)
    host.preview = `${startInfo.processName} ${(startInfo.args || []).join(' ')}`
}

function getCommandLineBuilderArgs(host) {
    return {
        processName: host.clisMeta.getCliFile(host._cli),
        arguments: host.changeInfo.questionsThatShouldBeVisible,
        values: host.values
    }
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

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function hideQuestions(questionsToHide) {
    return new Promise(async (resolve, reject) => {
        let count = 0

        function end(element) {
            element.style.display = "none"
            count++
            if (count == questionsToHide.length)
                resolve()
        }

        if (questionsToHide.length > 0)
            await asyncForEach(questionsToHide.reverse(), async (question) => {
                if (question.style.opacity === "0") {
                    end(question)
                } else {
                    transition(question, `opacity 1 0 ${FRAME_DELAY}ms linear`, {
                        onTransitionEnd(element, finished) {
                            end(element)
                        }
                    })
                }
                await sleep(STEP_DELAY)
            })
        else
            resolve()
    })
}

async function showQuestions(questionsToShow) {
    if (questionsToShow.length > 0)
        await asyncForEach(questionsToShow, async (question) => {
            question.style.display = "block"
            transition(question, `opacity 0 1 ${FRAME_DELAY}ms linear`, {
                onTransitionEnd(element, finished) {
                }
            })
            await sleep(STEP_DELAY)
        })
}

function whenRuleMet(host, cliArguments, whenRules) {
    let metRule = null
    for (var whenRule of whenRules) {
        const whenArgument = cliArguments.find(a => a.id == whenRule.argumentId)
        if (!whenArgument)
            throw new Error(`When rule points to an argument that does not exist: ${whenRule.name}`)
        if (whenRule.is === "anyOf") {
            var found = false
            for (var val of whenRule.values) {
                if (val.value === host.values[whenRule.argumentId]) {
                    found = true
                    break
                }
            }
            if (found) {
                metRule = whenRule
                break
            }
        }
    }
    return metRule
}

function canShowQuestion(host, cliArguments, cliArgument) {
    return !!whenRuleMet(host, cliArguments, cliArgument.showWhens)
}

function canFocusQuestion(host, cliArguments, cliArgument, changedQuestion) {
    const metRule = whenRuleMet(host, cliArguments, cliArgument.focusWhens)
    if (!metRule)
        return false
    return metRule.argumentId == changedQuestion.id
}

function findQuestion(host, cliArgument) {
    const questions = host.shadowRoot.querySelectorAll(`#div_${cliArgument.id}`)
    if (questions.length > 1)
        throw new Error(`Argument names must be unique. Found ${quuestions.length.toString()} questions called '${cliArgument.name}'`)
    if (questions.length < 1)
        throw new Error(`Couldn't find a question for argument ${cliArgument.name || cliArgument.format || cliArgument.type}`)
    return questions[0]
}

async function focusQuestion(questionDiv) {
    const inputsOrSelects = questionInputsOrSelects(questionDiv)
    if (!inputsOrSelects || !inputsOrSelects.length)
        throw new Error('Could not find any input or selects inside the div to focus')
    await sleep(200)
    inputsOrSelects[0].focus()
}

let _isAdministrating = false
let _adminPromise = null

async function administrateQuestions(host, changedQuestion) {
    if (_isAdministrating)
        throw new Error('Already busy with administration, please await the _adminPromise')
    _isAdministrating = true
    let resolve, reject
    _adminPromise = new Promise((res_, rej_) => {
        resolve = res_
        reject = rej_
    })
    try {
        host.changeInfo = workoutQuestionsChanges(host, changedQuestion)
        await hideQuestions(host.changeInfo.questionsToHide)
        await showQuestions(host.changeInfo.questionsToShow)
        administrateQuestionsRequirements(host.changeInfo)
        if (host.changeInfo.questionToFocus)
            await focusQuestion(host.changeInfo.questionToFocus)
    } finally {
        _isAdministrating = false
        resolve()
    }
}

function workoutQuestionsChanges(host, changedQuestion) {
    const cliArguments = host.clisMeta.getCliArguments(host._cli)
    const questionsThatShouldBeVisible = []
    const questionsThatShouldBeHidden = []
    const questionsToHide = []
    const questionsToShow = []
    let questionToFocus = null
    for (var cliArgument of cliArguments) {
        const question = findQuestion(host, cliArgument)
        if (cliArgument.showWhens && cliArgument.showWhens.length) {
            const show = canShowQuestion(host, cliArguments, cliArgument)
            const isVisible = question.style.display !== "none"
            if (show && !isVisible) {
                questionsToShow.push(question)
                questionsThatShouldBeVisible.push({ question, cliArgument })
            }
            else if (!show && isVisible) {
                questionsToHide.push(question)
                questionsThatShouldBeHidden.push(question)
            } else if (show) {
                questionsThatShouldBeVisible.push({ question, cliArgument })
            } else {
                questionsThatShouldBeHidden.push(question)
            }
        } else {
            questionsThatShouldBeVisible.push({ question, cliArgument })
        }
        if (cliArgument.focusWhens && cliArgument.focusWhens.length) {
            const focus = canFocusQuestion(host, cliArguments, cliArgument, changedQuestion)
            const isFocused = document.activeElement === question
            if (focus && !isFocused)
                questionToFocus = question
        }
    }
    return {
        questionsThatShouldBeHidden,
        questionsThatShouldBeVisible,
        questionsToHide,
        questionsToShow,
        questionToFocus
    }
}

function questionInputsOrSelects(questionDiv) {
    const inputs = questionDiv.querySelectorAll('input')
    if (inputs && inputs.length > 0) {
        return inputs
    } else {
        const selects = questionDiv.querySelectorAll('select')
        if (selects && selects.length > 0) {
            return selects
        } else {
            return []
        }
    }

}

function administrateQuestionsRequirements(changeInfo) {
    changeInfo.questionsThatShouldBeVisible.forEach(pair => {
        const inputsOrSelects = questionInputsOrSelects(pair.question)
        administrateInputsRequirement(inputsOrSelects, pair.cliArgument.required)
    })
    changeInfo.questionsThatShouldBeHidden.forEach(question => {
        const inputsOrSelects = questionInputsOrSelects(question)
        inputsOrSelects.forEach(input => {
            input.removeAttribute('required')
        })
    })
}

function administrateInputsRequirement(inputs, required) {
    inputs.forEach(input => {
        if (required)
            input.setAttribute('required', true)
        else
            input.removeAttribute('required')
    })
}

async function propertyChanged(host, event) {
    const id = event.target.id
    if (!id)
        throw new Error(`All bound elements must have an id`)
    host[id] = event.target.type == 'checkbox'
        ? event.target.checked
        : event.target.value
    if (id === 'cli') {
        host.templates = host.clisMeta.getCliTemplates(host._cli)
        host.template = ''
        dispatch(host, 'templatesLoaded')
    } else if (id === 'template' && host._template) {
        const template = host.templates.find(t => t.desc === host._template)
        for (let argument of template.arguments) {
            const element = host.shadowRoot.getElementById(argument.id)
            element.value = argument.value
            dispatch(element, 'change')
            await _adminPromise
        }
    }
}

function questionChanged(host, event) {
    const id = event.target.id
    if (!id)
        throw new Error(`All bound elements must have an id`)
    if (!host.values)
        host.values = {}
    host.values[id] = event.target.type == 'checkbox'
        ? event.target.checked
        : event.target.value
    administrateQuestions(host, event.target)
    buildPreview(host)
}

const CliArgumentsQuestionEngine = {
    clisMeta: {},
    cli: {
        get: (host, lastValue) => host._cli,
        set: (host, value, lastValue) => {
            if (host._isSettingCli)
                return
            host._isSettingCli = true
            try {
                host._cli = value
                const cliElement = host.shadowRoot.getElementById('cli')
                propertyChanged(host, { target: cliElement })
            } finally {
                host._isSettingCli = false
            }
        }
    },
    templates: [],
    template: {
        get: (host, lastValue) => host._template,
        set: (host, value, lastValue) => {
            if (host._isSettingTemplate)
                return
            host._isSettingTemplate = true
            try {
                host._template = value
                const templateElement = host.shadowRoot.getElementById('template')
                propertyChanged(host, { target: templateElement })
            } finally {
                host._isSettingTemplate = false
            }
        }
    },
    preview: SELECT_A_COMMAND,

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

    render: ({ clisMeta, _cli: cli, templates, _template: template, arguments, preview }) => {

        return html`

    ${containerStyles}
    ${inputStyles}

    <form onsubmit="${runClicked}">
        <cli-command-preview id="preview" text="${preview}"></cli-command-preview>

        <div class="container" id="container">

            <button type="submit" class="hidden-default-button" aria-hidden="true" tabIndex="-1"></button>

            <div class="line">
                <label for="cli">Cli</label>
                <select id="cli" value="${cli}" onchange="${html.set('cli')}">
                    <option value=""></option>
                    ${clisMeta && clisMeta.getClis().map(cli => html`<option value="${cli.name}">${cli.name}</option>`)}
                </select>
            </div>

            <div class="line">
                <label for="template">Template</label>
                <select id="template" value="${template}" onchange="${html.set('template')}">
                    <option value=""></option>
                    ${templates.map(template => html`<option value="${template.desc}">${template.desc}</option>`)}
                </select>
            </div>

            ${clisMeta && clisMeta
                .getCliArguments(cli)
                .map(argument => html`

            <div class="line" id="div_${argument.id}" style="display: block">
                <label for="${argument.id}">${argument.name}</label>
                ${argument.type == "select"
                        ? html`
                    <select id="${argument.id}" onchange="${questionChanged}">
                        <option value=""></option>
                        ${argument.options.map(option => html`<option value="${option.value}">${option.value}</option>`)}
                    </select>`
                        : argument.type == "text" || argument.type == "networklocation"
                            ? html`
                    <input id="${argument.id}" onchange="${questionChanged}" onkeyup="${questionChanged}" />`
                            : argument.type == "directory"
                                ? html`
                    <input id="${argument.id}" onchange="${questionChanged}" onkeyup="${questionChanged}" />
                    <button onclick="${selectDirectory(argument.id)}">Select Directory</button>`
                                : argument.type == "checkbox"
                                    ? html`
                    <input id="${argument.id}" type="checkbox" onchange="${questionChanged}" onkeyup="${questionChanged}" />`
                                    : "unsupported"}
            </div>
            ` )}

        </div>

        <div id="buttonsContainer" class="container">
            <button type="submit">Run</button>
        </div>
    </form>
    `
    }
}

function selectDirectory(id) {
    return function (host, event) {
        event.preventDefault()
        dialog.showOpenDialog({
            title: 'Select Directory',
            properties: ["openDirectory"]
        }).then(result => {
            if (!result.cancelled && result.filePaths[0]) {
                const element = host.shadowRoot.getElementById(id)
                element.value = result.filePaths[0]
                dispatch(element, 'change')
            }
        })
    }
}

define('cli-arguments-question-engine', CliArgumentsQuestionEngine)
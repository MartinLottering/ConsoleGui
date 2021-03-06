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

function whenRulesMet(host, cliArguments, whenRules, changeInfo) {
    const rulesMet = []
    for (var whenRule of whenRules) {
        const whenArgument = cliArguments.find(a => a.id == whenRule.argumentId)
        if (!whenArgument)
            throw new Error(`When-rule points to an argument that does not exist: ${whenRule.name}`)
        if (whenRule.is === "anyOf") {
            var found = false
            for (var val of whenRule.values) {
                const isQuestionVisible = 
                    changeInfo && changeInfo.questionsThatShouldBeVisible.find(_ => _.cliArgument.id === whenRule.argumentId)
                if (isQuestionVisible && val.value === host.values[whenRule.argumentId]) {
                    found = true
                    break
                }
            }
            if (found) 
                rulesMet.push(whenRule)
        }
    }
    return rulesMet
}

function canShowQuestion(host, cliArguments, cliArgument, changeInfo) {
    return whenRulesMet(host, cliArguments, cliArgument.showWhens, changeInfo).length == cliArgument.showWhens.length
}

function canFocusQuestion(host, cliArguments, cliArgument, changedQuestion, changeInfo) {
    const metRules = whenRulesMet(host, cliArguments, cliArgument.focusWhens, changeInfo)
    if (!metRules || !metRules.length)
        return false
    return metRules.find(_ => _.argumentId === changedQuestion.id)
}

function findQuestionUsingArgument(host, cliArgument) {
    const questions = host.shadowRoot.querySelectorAll(`#div_${cliArgument.id}`)
    if (questions.length > 1)
        throw new Error(`Argument names must be unique. Found ${quuestions.length.toString()} questions called '${cliArgument.name}'`)
    if (questions.length < 1)
        throw new Error(`Couldn't find a question for argument ${cliArgument.name || cliArgument.format || cliArgument.type}`)
    return questions[0]
}

function findQuestionUsingId(host, argumentId) {
    const questions = host.shadowRoot.querySelectorAll(`#div_${argumentId}`)
    if (questions.length > 1)
        throw new Error(`Argument names must be unique. Found ${quuestions.length.toString()} questions called '${argumentId}'`)
    if (questions.length < 1)
        throw new Error(`Couldn't find a question for argument ${argumentId}`)
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
    let resolveAdminPromise, rejectAdmin
    _adminPromise = new Promise((res_, rej_) => {
        resolveAdminPromise = res_
        rejectAdmin = rej_
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
        resolveAdminPromise()
    }
}

function workoutQuestionsChanges(host, changedQuestion) {
    const changeInfo = {
        questionsThatShouldBeHidden: [],
        questionsThatShouldBeVisible: [],
        questionsToHide: [],
        questionsToShow: [],
        questionToFocus: null
    }
    if (_applyingTemplate && _applyingTemplate.focusArgumentId) {
        changeInfo.questionToFocus = findQuestionUsingId(host, _applyingTemplate.focusArgumentId)
    }
    const cliArguments = host.clisMeta.getCliArguments(host._cli)
    for (var cliArgument of cliArguments) {
        const question = findQuestionUsingArgument(host, cliArgument)
        if (cliArgument.showWhens && cliArgument.showWhens.length) {
            const show = canShowQuestion(host, cliArguments, cliArgument, changeInfo)
            const isVisible = question.style.display !== "none"
            if (show && !isVisible) {
                changeInfo.questionsToShow.push(question)
                changeInfo.questionsThatShouldBeVisible.push({ question, cliArgument })
            }
            else if (!show && isVisible) {
                changeInfo.questionsToHide.push(question)
                changeInfo.questionsThatShouldBeHidden.push(question)
            } else if (show) {
                changeInfo.questionsThatShouldBeVisible.push({ question, cliArgument })
            } else {
                changeInfo.questionsThatShouldBeHidden.push(question)
            }
        } else {
            changeInfo.questionsThatShouldBeVisible.push({ question, cliArgument })
        }
        if (!changeInfo.questionToFocus && cliArgument.focusWhens && cliArgument.focusWhens.length) {
            const focus = canFocusQuestion(host, cliArguments, cliArgument, changedQuestion, changeInfo)
            const isFocused = document.activeElement === question
            if (focus && !isFocused)
                changeInfo.questionToFocus = question
        }
    }
    return changeInfo
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
    } else if (id === 'template' && host._template) 
        await applyTemplate(host)
}

let _applyingTemplate

async function applyTemplate(host) {
    _applyingTemplate = host.templates.find(t => t.desc === host._template)
    try {
        for (let argument of _applyingTemplate.arguments) {
            const element = host.shadowRoot.getElementById(argument.id)
            element.value = argument.value
            dispatch(element, 'change')
            await _adminPromise
        }
    } finally {
        _applyingTemplate = null
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
                    <select id="${argument.id}" onchange="${questionChanged}" style="${{ width: argument.width }}">
                        <option value=""></option>
                        ${argument.options.map(option => html`<option value="${option.value}">${option.value}</option>`)}
                    </select>`
                        : argument.type == "text" || argument.type == "networklocation"
                            ? html`
                    <input id="${argument.id}" onchange="${questionChanged}" onkeyup="${questionChanged}" style="${{ width: argument.width }}" />`
                            : argument.type == "directory"
                                ? html`
                    <input id="${argument.id}" onchange="${questionChanged}" onkeyup="${questionChanged}" style="${{ width: argument.width }}" />
                    <button onclick="${selectDirectory(argument.id)}">Select Directory</button>`
                                : argument.type == "checkbox"
                                    ? html`
                    <input id="${argument.id}" type="checkbox" onchange="${questionChanged}" onkeyup="${questionChanged}" style="${{ width: argument.width }}" />`
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
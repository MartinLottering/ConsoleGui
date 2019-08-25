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
        arguments: host.clisMeta.getCliArguments(host.cli),
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
                transition(question, `opacity 1 0 ${FRAME_DELAY}ms linear`, {
                    onTransitionEnd(element, finished) {
                        element.style.display = "none"
                        count++
                        if (count == questionsToHide.length)
                            resolve()
                    }
                })
                await sleep(STEP_DELAY)
            })
        else
            resolve()
    })
}

async function showQuestions(questionsToShow) {
    if (questionsToShow.length > 0)
        await asyncForEach(questionsToShow.reverse(), async (question) => {
            question.style.display = "block"
            transition(question, `opacity 0 1 ${FRAME_DELAY}ms linear`, {
                onTransitionEnd(element, finished) {
                }
            })
            await sleep(STEP_DELAY)
        })
}

function canShowQuestion(host, cliArguments, cliArgument) {
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
    return show
}

function findQuestion(host, cliArgument) {
    const questions = Array.from(host.shadowRoot.querySelectorAll("cli-argument-question"))
    const question = questions.find(q => q.argument === cliArgument)
    if (!question)
        throw new Error(`Couldn't find a question for argument ${cliArgument.name || cliArgument.format || cliArgument.type}`)
    return question
}

async function administrateQuestions(host) {
    const visibilityInfo = workoutQuestionsVisibility(host)
    await hideQuestions(visibilityInfo.questionsToHide)
    await showQuestions(visibilityInfo.questionsToShow)
    administrateQuestionsRequirements(visibilityInfo)
}

function workoutQuestionsVisibility(host) {
    const cliArguments = host.clisMeta.getCliArguments(host.cli)
    const questionsThatShouldBeVisible = []
    const questionsThatShouldBeHidden = []
    const questionsToHide = []
    const questionsToShow = []
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
    }
    return {
        questionsThatShouldBeHidden,
        questionsThatShouldBeVisible,
        questionsToHide,
        questionsToShow
    }
}

function administrateQuestionsRequirements(visibilityInfo) {
    visibilityInfo.questionsThatShouldBeVisible.forEach(pair => {
        const inputs = pair.question.shadowRoot.querySelectorAll('input')
        if (inputs && inputs.length > 0) {
            administrateInputsRequirement(inputs, pair.cliArgument.required)
        } else {
            const selects = pair.question.shadowRoot.querySelectorAll('select')
            if (selects && selects.length > 0) {
                administrateInputsRequirement(selects, pair.cliArgument.required)
            }
        }
        visibilityInfo.questionsThatShouldBeHidden.forEach(question => {
            const inputs = question.shadowRoot.querySelectorAll('input')
            if (inputs && inputs.length > 0) {
                inputs.forEach(input => {
                    input.removeAttribute('required')
                })
            }
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

function valueChanged(host, event) {
    if (!host.values)
        host.values = {}
    host.values[event.detail] = event.target.value
    buildPreview(host)
    administrateQuestions(host)
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

            ${clisMeta.getCliArguments(cli).map(argument => html`<cli-argument-question style="display: block;" argument=${argument} onchanged="${valueChanged}" required="true"></cli-argument-question>`)}

        </div>

        <div id="buttonsContainer" class="container">
            <button type="submit">Run</button>
        </div>
    </form>
    `
}

define('cli-arguments-question-engine', CliArgumentsQuestionEngine)
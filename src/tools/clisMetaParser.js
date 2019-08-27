const convert = require('xml-js')
const path = require('path')
const fs = require('fs')
const idify = require('./idify')

function createOption(optionMeta) {
    const option = {
        ...optionMeta._attributes,
        value: optionMeta._text
    }
    return option
}

function createOptions(options) {
    return !options
        ? []
        : produceFromOneOrMany(options.option, createOption)
}

function createShowWhenValue(valueMeta) {
    const showWhenValue = {
        ...valueMeta._attributes,
        value: valueMeta._text
    }
    return showWhenValue
}

function createShowWhenValues(values) {
    return !values
        ? []
        : produceFromOneOrMany(values, createShowWhenValue)
}

function createShowWhenArgument(argumentMeta) {
    const showWhenArgument = {
        ...argumentMeta._attributes,
        argumentId: idify(argumentMeta._attributes.name),
        values: createShowWhenValues(argumentMeta.value)
    }
    return showWhenArgument
}

function createShowWhens(showWhens) {
    return !showWhens
        ? []
        : produceFromOneOrMany(showWhens.argument, createShowWhenArgument)
}

function createFocusWhenArgument(argumentMeta) {
    const focusWhenArgument = {
        ...argumentMeta._attributes,
        argumentId: idify(argumentMeta._attributes.name),
        values: createShowWhenValues(argumentMeta.value)
    }
    return focusWhenArgument
}

function createFocusWhens(focusWhens) {
    return !focusWhens
        ? []
        : produceFromOneOrMany(focusWhens.argument, createFocusWhenArgument)
}

function createFormatArgument(argumentMeta) {
    const formatArgument = {
        value: argumentMeta._text
    }
    return formatArgument
}

function createFormats(format) {
    return !format
        ? []
        : produceFromOneOrMany(format.argument, createFormatArgument)
}

function createArgument(argumentMeta) {
    const argument = {
        ...argumentMeta._attributes,
        formats: createFormats(argumentMeta.format),
        id: idify(argumentMeta._attributes.name),
        options: createOptions(argumentMeta.options),
        showWhens: createShowWhens(argumentMeta["show-when"]),
        focusWhens: createFocusWhens(argumentMeta['focus-when'])
    }
    return argument
}

function createArguments(arguments) {
    return !arguments
        ? []
        : produceFromOneOrMany(arguments.argument, createArgument)
}

function createTemplateArgument(argumentMeta) {
    return {
        ...argumentMeta._attributes,
        id: idify(argumentMeta._attributes.name)
    }
}

function createTemplateArguments(templateMeta) {
    return produceFromOneOrMany(templateMeta.argument, createTemplateArgument)
}

function createTemplate(templateMeta) {
    const template = {
        ...templateMeta._attributes,
        arguments: createTemplateArguments(templateMeta)
    }
    return template
}

function createTemplates(templates) {
    return !templates
        ? []
        : produceFromOneOrMany(templates.template, createTemplate)
}

function produceFromOneOrMany(instanceOrSequence, factory) {
    if (!instanceOrSequence)
        return []
    const results = []
    if (instanceOrSequence.length)
        instanceOrSequence.forEach(item => {
            results.push(factory(item))
        })
    else
        results.push(factory(instanceOrSequence))
    return results
}

function createCli(cliMeta) {
    return {
        ...cliMeta._attributes,
        arguments: createArguments(cliMeta.arguments),
        templates: createTemplates(cliMeta.templates)
    }
}

module.exports = function () {

    const cliMetaPath = path.join(__dirname, '..', '..', 'clis-meta.xml')
    const cliMetaXml = fs.readFileSync(cliMetaPath, 'utf8')
    const cliMetaJson = convert.xml2json(cliMetaXml, { compact: true })
    const cliMeta = JSON.parse(cliMetaJson)

    const clis = {}
    let loaded = false

    function getClis() {
        if (!loaded) {
            loaded = true
            if (cliMeta && cliMeta.clis) {
                const clisArray = produceFromOneOrMany(cliMeta.clis.cli, createCli)
                clisArray.forEach(cli => clis[cli.name] = cli)
            }
        }
        return Object.values(clis)
    }

    function getCliArguments(cli) {
        if (!cli)
            return []
        return clis[cli].arguments
    }

    function getCliTemplates(cli) {
        if (!cli)
            return []
        const cliObj = clis[cli]
        if (!cliObj)
            throw new Error(`Could not find cli "${cli}"`)
        return cliObj.templates
    }

    return {
        getClis,
        getCliArguments,
        getCliTemplates
    }
}
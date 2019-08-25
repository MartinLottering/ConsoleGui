const convert = require('xml-js')
const path = require('path')
const fs = require('fs')


function createOption(optionMeta) {
    const option = {
        ...optionMeta._attributes,
        value: optionMeta._text
    }
    return option
}

function createOptions(options) {
    if (!options)
        return []

    const results = []
    if (options.option.length)
        options.option.forEach(optionMeta => {
            results.push(createOption(optionMeta))
        })
    else
        results.push(createOption(options.option))
    return results
}

function createShowWhenValue(valueMeta) {
    const showWhenValue = {
        ...valueMeta._attributes,
        value: valueMeta._text
    }
    return showWhenValue
}

function createShowWhenValues(values) {
    if (!values)
        return []

    const results = []
    if (values.length)
        values.forEach(valueMeta => {
            results.push(createShowWhenValue(valueMeta))
        })
    else
        results.push(createShowWhenValue(values))
    return results
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
    if (!showWhens)
        return []

    const results = []
    if (showWhens.argument.length)
        showWhens.argument.forEach(argumentMeta => {
            results.push(createShowWhenArgument(argumentMeta))
        })
    else
        results.push(createShowWhenArgument(showWhens.argument))
    return results
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
    if (!focusWhens)
        return []

    const results = []
    if (focusWhens.argument.length)
        focusWhens.argument.forEach(argumentMeta => {
            results.push(createFocusWhenArgument(argumentMeta))
        })
    else
        results.push(createFocusWhenArgument(focusWhens.argument))
    return results
}

function createArgument(argumentMeta) {
    const argument = {
        ...argumentMeta._attributes,
        id: idify(argumentMeta._attributes.name),
        options: createOptions(argumentMeta.options),
        showWhens: createShowWhens(argumentMeta["show-when"]),
        focusWhens: createFocusWhens(argumentMeta['focus-when'])
    }
    return argument
}

function createArguments(arguments) {
    if (!arguments)
        return []

    const results = []
    if (arguments.argument.length)
        arguments.argument.forEach(argumentMeta => {
            results.push(createArgument(argumentMeta))
        })
    else
        results.push(createArgument(arguments.argument))
    return results
}

function createCli(cliMeta) {
    return {
        ...cliMeta._attributes,
        arguments: createArguments(cliMeta.arguments)
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
                if (cliMeta.clis.cli) {
                    const cli = createCli(cliMeta.clis.cli)
                    clis[cli.name] = cli
                } else if (cliMeta.clis.length) {
                    cliMeta.clis.forEach(cliElement => {
                        const cli = createCli(cliElement)
                        clis[cli.name] = cli
                    })
                }
            }
        }
        return Object.values(clis)
    }

    function getCliArguments(cli) {
        if (!cli)
            return []
        return clis[cli].arguments
    }

    return {
        getClis,
        getCliArguments
    }
}
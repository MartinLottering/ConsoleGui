const convert = require('xml-js')
const path = require('path')
const fs = require('fs')

function createArgument(argumentMeta) {
    return {
        name: argumentMeta._attributes.name
    }
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
        name: cliMeta._attributes.name,
        file: cliMeta._attributes.file,
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
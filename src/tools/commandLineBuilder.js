function processArgument(processArgs, values, { id, format, formats, type }) {
    if (!values[id])
        return
    if (format && formats && formats.length)
        throw new Error(`Both format attribute and format elements are not supported`)
    if (format) {
        if (format.includes("{value}"))
            processArgs.push(format.replace("{value}", values[id]))
        else if (type === "checkbox") {
            if (values[id])
                processArgs.push(format)
        } else
            processArgs.push(format)
    } else {
        for (let format of formats) {
            processArgument(processArgs, values, { id, format: format.value, formats: null, type })
        }
    }
}

exports.getProcessStartInfo = function getProcessStartInfo({ processName, arguments, values }) {
    let processArgs = []

    arguments.forEach(pair => {
        processArgument(processArgs, values, pair.cliArgument)
    });

    return {
        processName,
        args: processArgs
    }
}

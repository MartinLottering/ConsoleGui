function processArgument(processArgs, values, { id, format, type }) {
    if (!values[id])
        return
    if (format) {
        if (format.includes("{value}"))
            processArgs.push(format.replace("{value}", values[id]))
        else if (type === "checkbox") {
            if (values[id])
                processArgs.push(format)
        }
    }
}

exports.getProcessStartInfo = function getProcessStartInfo({ arguments, values }) {
    let processName = 'pipeline'
    let processArgs = []

    arguments.forEach(pair => {
        processArgument(processArgs, values, pair.cliArgument)
    });

    return {
        processName,
        args: processArgs
    }
}

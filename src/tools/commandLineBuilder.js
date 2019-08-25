function processArgument(processArgs, values, { name, format, type }) {
    if (!values[name])
        return
    if (format) {
        if (format.includes("{value}"))
            processArgs.push(format.replace("{value}", values[name]))
        else if (type === "checkbox") {
            if (values[name])
                processArgs.push(format)
        }
    }
}

exports.getProcessStartInfo = function getProcessStartInfo({ arguments, values }) {
    let processName = 'pipeline'
    let processArgs = []

    arguments.forEach(argument => {
        processArgument(processArgs, values, argument)
    });

    return {
        processName,
        args: processArgs
    }
}

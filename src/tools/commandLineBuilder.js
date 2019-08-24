exports.getProcessStartInfo = function getProcessStartInfo({ arguments, values }) {
    let processName = 'pipeline'
    let processArgs = []

    arguments.forEach(argument => {
        if (!values[argument.name])
            return
        if (argument.format && argument.format.includes("{value}"))
            processArgs.push(argument.format.replace("{value}", values[argument.name]))
    });

    return {
        processName,
        args: processArgs
    }
}

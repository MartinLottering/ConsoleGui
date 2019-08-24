function getSafeOptionalTimeoutArgs(timeout) {
    return timeout ? ['--timeout', timeout] : []
}

function replaceTokens(str, tokenPackage) {
    const packageArgs = destructPackage(tokenPackage)
    return str.replace(/{subsystem}/, packageArgs.subsystem)
        .replace(/{package}/, tokenPackage)
}

function destructPackage(package) {
    const parts = package.split('_')
    const subsystem = parts.length > 0 ? parts[0] : ''
    const feature = parts.length > 1 ? parts[1] : ''
    const version = parts.length > 2 ? parts[2] : ''
    const release = parts.length > 3 ? parts[3] : ''
    return {
        subsystem: subsystem,
        feature: feature,
        version: version,
        release: release
    }
}

exports.getProcessStartInfo = function getProcessStartInfo({
    command, tokenPackage, package, machine,
    purge, job, from, to, environment, timeout,
    source, overwrite, debug, skipupdater }
) {
    let processName = 'pipeline'
    let args = []

    switch (command) {
        case 'ping':
            args = [
                '--ping',
                '--machine',
                machine
            ]
            break

        case 'package':
            const packageArgs = destructPackage(tokenPackage)
            args = ['--package']
            if (packageArgs.subsystem)
                args = args.concat([
                    '--subsystem',
                    packageArgs.subsystem
                ])
            if (packageArgs.feature)
                args = args.concat([
                    '--feature',
                    packageArgs.feature
                ])
            if (packageArgs.version)
                args = args.concat([
                    '--version',
                    packageArgs.version
                ])
            if (packageArgs.release)
                args = args.concat([
                    '--release',
                    packageArgs.release
                ])
            if (source)
                args = args.concat([
                    '--source',
                    source
                ])
            if (purge)
                args = args.concat([
                    '--purge',
                    purge ? 'true' : 'false'
                ])
            break

        case 'copy':
            args = [
                '--copy',
                '--job',
                job,
                '--from',
                replaceTokens(from, tokenPackage),
                '--to',
                replaceTokens(to, tokenPackage),
                '--overwrite',
                overwrite.checked ? 'true' : 'false'
            ]
            break

        case 'deploy':
            args = [
                '--deploy',
                '--package',
                package,
                '--machine',
                machine,
                '--environment',
                environment
            ]
            break

        default:
            processName = SELECT_A_COMMAND
    }

    if (debug)
        args = args.concat(['--debug'])
    if (skipupdater)
        args = args.concat(['--noupdate'])

    const optionalTimeoutArgs = getSafeOptionalTimeoutArgs(timeout)

    return {
        processName,
        args: args.concat(optionalTimeoutArgs)
    }
}

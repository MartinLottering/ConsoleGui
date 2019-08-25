function selectDirectory(name) {
    return function (host, event) {
        event.preventDefault()
        dialog.showOpenDialog({
            title: 'Select Directory',
            properties: ["openDirectory"]
        }).then(result => {
            if (!result.cancelled && result.filePaths[0]) {
                const element = host.shadowRoot.getElementById(name)
                element.value = result.filePaths[0]
                dispatch(element, 'change')
            }
        })
    }
}

const CliArgumentQuestion = {
    argument: {},

    render: ({ argument }) => {
        return
    }
}

define('cli-argument-question', CliArgumentQuestion)

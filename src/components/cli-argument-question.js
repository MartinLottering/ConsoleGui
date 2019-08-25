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
        return html`

        ${containerStyles}
        ${inputStyles}

        <div class="line">
            <label for="${argument.name}">${argument.name}</label>
            ${argument.type == "select"
                ? html`
                <select id="${argument.name}" onchange="${valuePropertyChanged}">
                    <option value=""></option>
                    ${argument.options.map(option => html`<option value="${option.value}">${option.value}</option>`)}
                </select>`
                : argument.type == "text" || argument.type == "networklocation"
                    ? html`
                <input id="${argument.name}" onchange="${valuePropertyChanged}" onkeyup="${valuePropertyChanged}" />`
                    : argument.type == "directory"
                        ? html`
                <input id="${argument.name}" onchange="${valuePropertyChanged}" onkeyup="${valuePropertyChanged}" />
                <button onclick="${selectDirectory(argument.name)}">Select Directory</button>`
                        : argument.type == "checkbox"
                            ? html`
                <input id="${argument.name}" type="checkbox" onchange="${valuePropertyChanged}" onkeyup="${valuePropertyChanged}" />`
                            : "unsupported"}
        </div>
    `
    }
}

define('cli-argument-question', CliArgumentQuestion)

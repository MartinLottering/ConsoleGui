const CliArgumentQuestion = {
    argument: {},

    render: ({ argument }) => html`

        ${containerStyles}
        ${inputStyles}

        <div class="line">
            <label for="input">${argument.name}</label>
        </div>

    `
}

define('cli-argument-question', CliArgumentQuestion)
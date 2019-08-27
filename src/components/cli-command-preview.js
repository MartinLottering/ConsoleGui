const CliCommandPreview = {
  text: '',

  render: ({ text }) => html`
        ${containerStyles}
        <div class="container">
            <fieldset>
                <legend>Preview</legend>
                <div class="previewBox" id="preview">
                    ${text}
                </div>
            </fieldset>
            <copy-to-clipboard-button text="${text}"></copy-to-clipboard-button>
        </div>
    `
}

define('cli-command-preview', CliCommandPreview)

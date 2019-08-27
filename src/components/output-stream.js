function scrollToBottom (host) {
  const output = host.shadowRoot.getElementById('output')
  if (output) { output.scrollTop = output.scrollHeight + 20 }
}

const OutputStream = {
  lines: {
    get: (host, lastValue) => {
      return host._lines || lastValue || []
    },
    set: (host, value, lastValue) => {
      host._lines = value
      scrollToBottom(host)
    }
  },

  render: ({ lines }) => html`
        ${containerStyles}
        <div id="outputContainer" class="container">
            <fieldset>
                <legend>Output</legend>
                <textarea 
                    id="output" 
                    name="output" 
                    style="height: 200px;"
                    class="fullwidth previewBox">${lines}</textarea>
            </fieldset>
            <copy-to-clipboard-button text="${lines && lines.join('')}"></copy-to-clipboard-button>
        </div>
        `
}

define('output-stream', OutputStream)

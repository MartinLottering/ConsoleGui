function copyToClipboard (host, event) {
  if (host.text) { clipboard.writeText(host.text) }
}

const CopyToClipboardButton = {
  text: '',

  render: () => html`
    <style>
        .white-box {
            padding: 2px;
            background: white;
        }

        .float-top-right {
            position: absolute;
            top: 0px;
            right: 10px;
        }
    </style>

    <div class="white-box float-top-right">        
        <img src="../images/copy.png" onclick="${copyToClipboard}" />
    </div>    
    `
}

define('copy-to-clipboard-button', CopyToClipboardButton)

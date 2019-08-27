module.exports = html`
    <style>
        .line {
            margin: 5px;
        }

        .hidden-default-button {
            width: 0;
            height: 0;
            padding: 0;
            border: 0;
            margin: 0;
        }

        label {
            display: inline-block;
            width: 130px;
        }

        input, select {
            border-radius: 5px;
            width: 300px;
            margin: 0px;    

            font-family: Verdana,sans-serif;
            font-size: 15px;
            line-height: 1.5;
        }

        input[type=checkbox] { 
            width: auto;
        }

        button {
            width: 120px;
            height: 25px;
        }

        .hidden {
            display: none;
        }
    </style>
`

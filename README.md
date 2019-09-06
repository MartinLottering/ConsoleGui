# ConsoleGui

> A question engine to generate a list of questions that form the arguments to a console application. 
>
> A graphical user interface for console applications or command line interfaces. 
> 
> Create reusable templates of combinations of arguments passed to the console application.

You can give default values to console arguments based on which template you start with.

A tray menu provides quick access to your templates and the gui.

Decide which questions to hide and show when other arguments change.

Also decide which question to focus and start with as arguments change.

The question rules are maintained in a easy to understand xml file.

# Who is this tool for?

If you
1. want to type less when using a console application.
2. use a console application with specific arguments often.
3. cannot remember all the console argument combinations.
4. ...

I recently went on production-support duty at the office and found myself supporting users by running commands in a console application. The commands were pretty complicated and it was easy to make mistakes. So I eventually copied and pasted the commands from a saved text file to make it easier. A tool like this would have made life so much easier.

This tool is probably not a tool that you will need to use often, but it will be very useful the day or week that you need to use it a lot.

If your team or organisation automate parts of their development or testing process, you will probably also see a few new console applications pop-up. This tool can help your team and your users learn the new features and commands of the console applications.

If your users ask you, "why don't you develop a GUI for your console application?", why not setup the commands in the configuration (xml) file, and send them this tool?

# The Question Engine

This is a sample of the xml used by the question engine to build the questions:

```xml
<clis>
  <cli name="npm" file="C:\Program Files\nodejs\npm.cmd">
    <arguments>
      <argument format="{value}" name="Command" type="select" required="true">
        <options>
          <option>config</option>
        </options>
      </argument>
      <argument format="{value}" name="Config Command" type="select" required="true">
        <options>
          <option>rm</option>
        </options>
        <show-when>
          <argument name="Command" is="anyOf">
            <value>config</value>
          </argument>
        </show-when>
      </argument>
      <argument format="{value}" name="Config" type="select" required="true">
        <options>
          <option>proxy</option>
          <option>https-proxy</option>
        </options>
        <show-when>
          <argument name="Config Command" is="anyOf">
            <value>rm</value>
          </argument>
        </show-when>
      </argument>
    </arguments>
    <templates>
      <template desc="Clear proxy">
        <argument name="Command" value="config" />
        <argument name="Config Command" value="rm" />
        <argument name="Config" value="proxy" />
      </template>
      <template desc="Clear https-proxy">
        <argument name="Command" value="config" />
        <argument name="Config Command" value="rm" />
        <argument name="Config" value="https-proxy" />
      </template>
    </templates>
  </cli>
  ...
```

Your customized xml file is read from the %appdata% folder. 

  e.g. C:\Users\MartinLottering\AppData\Roaming\ConsoleGui\clis-meta.xml

You can safely add sensitive and private information or just add customized templates to this file without it being shared with other people. It will then also be excluded from source control.

## &lt;cli&gt; element

The `<cli>` element is used to group all the questions for a specific console application.

Attribute     | Description
---           | ---
`name`        | The name to display in the drop-down.
`file`        | The path to execute. This can be an absolute path or a system path.

## &lt;argument&gt; element

The `<argument>` element is used to describe a question used to populate an argument passed to the console application.

Attribute     | Description
---           | ---
`format`      | A find and replace style string to format the argument exactly as you expect. `{value}` is replaced with the value of the question. The format attribute can also be replaced with a `<format>` element with one or two `<argument>` elements to split the argument into two arguments. An example is shown down below.
`name`        | The name or label of the question.
`type`        | The type of question input. Support types are: 1. `select`, 2. `text`, 3. `directory`, 4. `networklocation`, 5. `checkbox`

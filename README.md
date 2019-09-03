# ConsoleGui

Console Gui uses a question engine to build a list of questions that form the arguments to a console application. 

It is a simple graphical user interface for console applications or command line interfaces. 

You can create reusable templates of combinations of parameters passed to the console application.

You can give default values to console arguments based on which template you start with.

A tray menu provides quick access to your templates and the gui.

Decide which parameters to hide and show when other parameters change.

Also decide which parameter to focus and start with as parameters change.

The console parameter rules are maintained in a easy to understand xml file.

# Who is this tool for?

If you
(1) want to type less when using a console application.
(2) use a console application with specific parameters often.
(3) cannot remember all the console argument combinations.
(4) ...

I recently went on production-support duty at the office and found myself supporting users by running commands in a console application. The commands were pretty complicated and it was easy to make mistakes. So I eventually copied and pasted the commands from a saved text file to make it easier. A tool like this would have made life so much easier.

This tool is probably not a tool that you will need to use often, but it will be very useful the day or week that you need to use it a lot.

If your team or organisation automate parts of their development or testing process, you will probably also see a few new console applications pop-up. This tool can help your team and your users learn the new features and commands of the console applications.

If your users ask you, "why don't you develop a GUI for your console application?", why not setup the commands in the configuration (xml) file, and send them this tool?

# Your customized Console Gui Xml

Your customized xml file is read from the %appdata% folder. 

  e.g. C:\Users\MartinLottering\AppData\Roaming\ConsoleGui\clis-meta.xml

You can safely add sensitive and private information or just customized templates to this file without it being shared with other people. It will then also be excluded from source control.

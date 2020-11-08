# vscode-sosml 

This extension allows you to interpret your SML code with the SOSML interpreter.
It basically recreates the functionality of the [SOSML editor](https://sosml.org/editor) right in Visual Studio Code, for your convenience.

I created this becuse I don't like editing code in my browser and I like to keep my files in my own folders instead of my browser cache.

![Screenshot](https://github.com/bmo-at/vscode-sosml/blob/master/static/screenshots/helloworld.png?raw=true)

## Features

It is currently still a work in progress, so more features are coming.

### Implemented

* Syntax highlighting for SML
* Interpreting the contents of an SML file with the SOSML interpreter

Currently you can only open one Interpreter at a time based on the contents of one file. To do so, open up your SML file, press CTRL + SHIFT + P to open up the command bar and type 'sosml interpret'. This should bring up the vscode-sosml.interpret command. You can of course assign this command to a hotkey in the settings.
Executing this will open up an interpreter result of the contents of the opened SML file to the side, showing you what the code you wrote evaluates to.
It will automagically be updated once you make changes to and save the SML file.

### Work in Progress

* User curated library of functions to be loaded before evaluating of any file
* ...
* feature wishes welcome (just open up an issue on the [GitHub repo](https://github.com/bmo-at/vscode-sosml/issues)) 

## Requirements

This extension requires language support for SML. This is provided by [vscode-better-sml](https://marketplace.visualstudio.com/items?itemName=stonebuddha.vscode-better-sml).

When installing this extension, you should be prompted to also install [vscode-better-sml](https://marketplace.visualstudio.com/items?itemName=stonebuddha.vscode-better-sml), but in case it isn't just visit the link and install it yourself.

## Known Issues

* ~~Comments are not possible as of now and will lead to an evalutation error [#1](https://github.com/bmo-at/vscode-sosml/issues/1)~~ This has been fixed as of Version 1.1.0

## Release Notes

### 1.1.0

[Changelog](https://github.com/bmo-at/vscode-sosml/blob/master/CHANGELOG.md#110---1182020)

### 1.0.0

Initial release of vscode-sosml

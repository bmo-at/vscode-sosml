import * as vscode from 'vscode';

import { getFirstState, interpret, InterpreterOptions, PrintOptions, Errors, State } from '@sosml/interpreter';
import * as fs from 'fs';
import * as path from 'path';
import { normalize } from 'path';

export class SMLView {

    public static currentView: SMLView | undefined;

    private static _config = vscode.workspace.getConfiguration('vscode-sosml');

    private _document: vscode.TextDocument;
    private readonly _panel: vscode.WebviewPanel;
    private _outputchannel: vscode.OutputChannel;
    private _disposables: vscode.Disposable[] = [];

    public static configChanged(newConfig: vscode.WorkspaceConfiguration) {
        SMLView._config = newConfig;
        SMLView.currentView?._update();
    }

    public static create(document: vscode.TextDocument) {
        let smlFilename = (document.fileName
            .split('/')
            .pop() || '')
            .split('.')
            .filter((text) => text !== 'sml')
            .join('.');

        let outputchannel = vscode.window.createOutputChannel(`SOSML Result - ${smlFilename}`);

        const panel = vscode.window.createWebviewPanel(
            'sosml.interpreterResult',
            `Interpreter Result - ${smlFilename}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        SMLView.currentView = new SMLView(panel, outputchannel, document);
    }

    public static update(document: vscode.TextDocument) {
        SMLView.currentView?._update();
    }

    public isCurrent = (document: vscode.TextDocument) => document === this._document;

    private static _createInterpreter(preloadedUserFunctions?: string) {
        const interpreterOptions: InterpreterOptions = {
            allowSuccessorML: false,
            allowVector: true,
            disableElaboration: false,
            disableEvaluation: false,
            strictMode: true,
            allowUnicode: false,
            allowUnicodeTypeVariables: false,
            allowCommentToken: false
        };

        const interpreterState: State = interpret(preloadedUserFunctions || "", getFirstState(undefined, interpreterOptions), interpreterOptions).state;

        const printOptions: PrintOptions = {
            boldText: ((text: string) => `<b>${text}</b>`),
            italicText: ((text: string) => `<i>${text}</i>`),
            showTypeVariablesAsUnicode: true,
            stopId: interpreterState.id + 1
        };

        return { options: interpreterOptions, state: interpreterState, printOptions };

    }

    private constructor(panel: vscode.WebviewPanel, outputchannel: vscode.OutputChannel, document: vscode.TextDocument) {
        this._panel = panel;
        this._outputchannel = outputchannel;
        this._document = document;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        SMLView.currentView = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()!.dispose();
        }
    }

    private _update() {

        this._panel.webview.html = this._generateHTML(this._document.getText());
    }

    private _generateHTML(documentText: string) {
        let interpreter = SMLView._createInterpreter();

        let preloadedUserFunctions = SMLView._config.preloadedUserFunctions as string;

        let preloadedUserFunctionsOutput = _evaluateProgram(preloadedUserFunctions, interpreter);

        let preloadedUserFunctionsHTML = (preloadedUserFunctionsOutput !== "") ? ('<button class=collapsible>Preloaded User Functions</button>' + `<div class=content>${preloadedUserFunctionsOutput
            .split(';')
            .filter(x => x !== '\n')
            .map((x) => { if (!(x.startsWith('There was a problem with your code:'))) { return x + ';'; } else { return x; } })
            .reduce((prev, current) => { return prev + current + '</p>'; }, '<p>')
            .replace(/\n/g, '')
            .trim()}</div>`) : "";

        let importedCode = _processImports(documentText, this._document.fileName)
            .map((element) => element.content)
            .reduce((accumulator, current) => accumulator + current, "");

        let importedCodeOutput = _evaluateProgram(importedCode, interpreter);

        let importedCodeHTML = (importedCodeOutput !== "") ? ('<button class=collapsible>Imported Code</button>' + `<div class=content>${importedCodeOutput
            .split(';')
            .filter(x => x !== '\n')
            .map((x) => { if (!(x.startsWith('There was a problem with your code:'))) { return x + ';'; } else { return x; } })
            .reduce((prev, current) => { return prev + current + '</p>'; }, '<p>')
            .replace(/\n/g, '')
            .trim()}</div>`) : "";

        let smlResult = documentText
            .replace(/[\n\r]/g, '\n')
            .split(';')
            .map((program) => _evaluateProgram(program + ';', interpreter));

        let styleSheet = `<style> \
code { font-family: monospace; color: black; font-weight: 600; } \
div { border-radius: 5px; border: 1px solid grey; padding: 3px; margin: 3px; } \
button { border-radius: 5px; border: 1px solid grey; padding: 3px; } \
.div-0 { background-color: deepskyblue; } .div-1 { background-color: lawngreen; } \
.div-2 { background-color: teal; } .div-3 { background-color: yellowgreen; } \
.div-4 { background-color: darkviolet; } .div-error { background-color: black; color: crimson;} \
.collapsible { background-color: #777; color: white; cursor: pointer; width: 100%; text-align: left; outline: none; font-size: 12px; } \
.active, .collapsible:hover { background-color: #555; } \
.collapsible:after { content: '\u002B'; color: white; font-weight: bold; float: right; margin-left: 5px; } \
.active:after { content: '\u2212'; } \
.content { padding: 0 18px; max-height: 0; overflow: hidden; transition: max-height 0.2s ease-out; background-color: #f1f1f1; } \
</style>`;
        let script = `<script>
var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    } 
    });
}
</script>`;

        return styleSheet +
            '<code>' +
            preloadedUserFunctionsHTML +
            importedCodeHTML +
            smlResult
                .filter(x => x !== '')
                .map((program, index) => {
                    const start = program.startsWith('There was a problem with your code:') ?
                        `<div class="div-error">` : `<div class="div-${index % 5}">`;
                    return start + program
                        .split(';')
                        .filter(x => x !== '\n')
                        .map((x) => { if (!(x.startsWith('There was a problem with your code:'))) { return x + ';'; } else { return x; } })
                        .reduce((prev, current) => { return prev + current + '</p>'; }, '<p>')
                        .replace(/\n/g, '')
                        .trim() +
                        '</div>';
                })
                .join('\n') +
            '</code>' + script;
    }


}

function _evaluateProgram(smlProgram: string, interpreter: any) {

    try {
        let interpreterResult = interpret(smlProgram, interpreter.state, interpreter.options);

        return interpreterResult.evaluationErrored ? (
            `There was a problem with your code: ${interpreterResult.error}`
            + interpreterResult.warnings
                .map((warning) => { return (warning.type >= -1) ? `Attention: ${warning.message}` : `Message: ${warning.message}`; })
                .reduce((acc, val) => `${acc}\n${val}`)
        ) : ((() => {
            let state = interpreterResult.state.toString(interpreter.printOptions);
            interpreter.printOptions.stopId = interpreterResult.state.id + 1;
            interpreter.state = interpreterResult.state;
            return state;
        })());
    } catch (e) {
        if (!(e instanceof Errors.IncompleteError)) {
            return `There was a problem with your code: ${e}`;
        } else {
            return `unknown error: ${e}`;
        }
    }
}

function _processImports(content: string, path: string) {
    let root = { content, path, level: 0 };
    let imports = [root];
    let importPaths = _extractImportPaths(content, path);
    if (importPaths.length > 0) {
        let contents = importPaths.map((importPath) => fs.readFileSync(importPath).toString());
        let zipped = importPaths.map((path, index) => { return { path, content: contents[index] }; });
        let newImports = zipped.map(({ content, path }) => _processDeeperImports(content, path, 1));
        let flattened = ([] as {
            path: string;
            content: string;
            level: number;
        }[]).concat(...newImports);
        imports.push(...flattened);
    }
    return imports.sort((a, b) => {
        if (a.level > b.level) { return -1; }
        if (a.level < b.level) { return 1; }
        return 0;
    }).filter((value) => value.level > 0);
}

function _processDeeperImports(content: string, path: string, level: number): {
    path: string;
    content: string;
    level: number;
}[] {
    let imports = [];
    let importPaths = _extractImportPaths(content, path);
    if (importPaths.length > 0) {
        let contents = importPaths.map((importPath) => fs.readFileSync(importPath).toString());
        let zipped = importPaths.map((path, index) => { return { path, content: contents[index] }; });
        let newImports = zipped.map(({ content, path }) => _processDeeperImports(content, path, (level + 1)));
        let flattened = ([] as any[]).concat(...newImports);
        imports.push(...flattened);
    }
    imports.push({ path, content, level });
    return imports;
};

function _extractImportPaths(content: string, path: string) {
    let basedir = path.replace(path.split("/").pop()!, "");

    let usingStatements = content
        .split('\n')
        .filter((string => string.includes("@using")));

    let usingFilePaths = usingStatements
        .map((using) => using.replace(/(\(\*( )*@using( )*)/g, ""))
        .map((using) => using.replace(/( )*\*\)/g, ""));

    let normalizedPaths = usingFilePaths
        .map((using) => normalize(`${basedir}${using}`));

    return normalizedPaths;
}
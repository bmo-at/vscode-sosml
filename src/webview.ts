import * as vscode from 'vscode';

import { getFirstState, interpret, InterpreterOptions, PrintOptions, Errors, State } from '@sosml/interpreter';

export class SMLView {
    public static currentView: SMLView | undefined;

    private _smlCode: string = '';
    private readonly _interpreterOptions: InterpreterOptions = {
        allowSuccessorML: false,
        allowVector: true,
        disableElaboration: false,
        disableEvaluation: false,
        strictMode: true,
        allowUnicode: false,
        allowUnicodeTypeVariables: false,
        allowCommentToken: false
    };
    private _interpreterState: State = getFirstState(undefined, this._interpreterOptions);
    private _printOptions: PrintOptions = {
        boldText: ((text: string) => text.bold()),
        italicText: ((text: string) => text.italics()),
        showTypeVariablesAsUnicode: true,
        stopId: this._interpreterState.id + 1
    };
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(smlDocument: vscode.TextDocument) {

        if (SMLView.currentView) {
            SMLView.currentView._smlCode = smlDocument.getText();
            SMLView.currentView._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'sosml.interpreterResult',
            `Interpreter Result - ${(smlDocument.fileName
                .split('/')
                .pop() || '')
                .split('.')
                .filter((text) => text !== 'sml')
                .join('.')}`,
            vscode.ViewColumn.Beside
        );

        SMLView.currentView = new SMLView(panel, smlDocument.getText());
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, smlCode: string) {
        SMLView.currentView = new SMLView(panel, smlCode);
    }

    private constructor(panel: vscode.WebviewPanel, smlCode: string) {
        this._panel = panel;
        this._smlCode = smlCode;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        SMLView.currentView = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()!.dispose();
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview() {

        let smlResult = this._smlCode.split(';').map((program) => this._evaluateProgram(program + ';'));

        let styleSheet = `<style> code { font-family: monospace; color: black; font-weight: 600; } div { border-radius: 5px; border: 1px solid grey; padding: 3px; margin: 3px; } .div-0 { background-color: deepskyblue; } .div-1 { background-color: lawngreen; } .div-2 { background-color: teal; } .div-3 { background-color: yellowgreen; } .div-4 { background-color: darkviolet; } .div-error { background-color: black; color: crimson;} </style>`;

        return styleSheet +
            '<code>' +
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
            '</code>';
    }

    private _evaluateProgram(smlProgram: string) {
        try {
            let interpreterResult = interpret(smlProgram, this._interpreterState, this._interpreterOptions);

            return interpreterResult.evaluationErrored ? (
                `There was a problem with your code: ${interpreterResult.error}`
                + interpreterResult.warnings
                    .map((warning) => { return (warning.type >= -1) ? `Attention: ${warning.message}` : `Message: ${warning.message}`; })
                    .reduce((acc, val) => `${acc}\n${val}`)
            ) : ((() => {
                let state = interpreterResult.state.toString(this._printOptions);
                this._printOptions.stopId = interpreterResult.state.id + 1;
                this._interpreterState = interpreterResult.state;
                return state;
            })());
        } catch (e) {
            if (!(e instanceof Errors.IncompleteError)) {
                return `There was a problem with your code: ${e}`;
            } else {
                return 'unknown error';
            }
        }
    }
}
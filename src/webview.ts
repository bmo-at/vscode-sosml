import * as vscode from 'vscode';

import { getFirstState, interpret, InterpreterOptions, PrintOptions, Errors, State } from '@sosml/interpreter';

export class SMLView {
    public static currentView: SMLView | undefined;

    public static readonly viewType = 'vscode-sosml';

    private _smlCode: string = '';
    private _interpreterState: State = getFirstState();
    private readonly _interpreterOptions: InterpreterOptions = {
        allowSuccessorML: true,
        allowVector: true,
        disableElaboration: false,
        disableEvaluation: false,
        strictMode: false,
        allowUnicode: false,
        allowUnicodeTypeVariables: false,
        allowCommentToken: true
    };
    private _printOptions: PrintOptions = {
        boldText: ((text: string) => text.bold()),
        italicText: ((text: string) => text.italics()),
        showTypeVariablesAsUnicode: true,
        stopId: this._interpreterState.id + 1
    };
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, smlCode: string) {
        if (SMLView.currentView) {
            SMLView.currentView._smlCode = smlCode;
            SMLView.currentView._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            SMLView.viewType,
            'Interpreter Result',
            vscode.ViewColumn.Beside,
            { enableFindWidget: true }
        );

        SMLView.currentView = new SMLView(panel, extensionUri, smlCode);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, smlCode: string) {
        SMLView.currentView = new SMLView(panel, extensionUri, smlCode);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, smlCode: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
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

        let smlResult = (() => {
            try {
                let out = '';
                let result = interpret(this._smlCode, this._interpreterState, this._interpreterOptions);

                if (result.evaluationErrored) {
                    out += 'There was a problem with your code:\n'
                        + '\x1b[31;40;1m' + result.error + '\x1b[39;49;0m\n';
                } else {
                    out += result.state.toString(this._printOptions);
                    this._printOptions.stopId = result.state.id + 1;
                    this._interpreterState = result.state;
                }

                if (result.warnings !== undefined) {
                    for (let i = 0; i < result.warnings.length; ++i) {
                        if (result.warnings[i].type >= -1) {
                            out += 'Attention: ' + result.warnings[i].message;
                        } else {
                            out += 'Message: ' + result.warnings[i].message;
                        }
                    }
                }

                return out;

            } catch (e) {
                if (!(e instanceof Errors.IncompleteError)) {
                    return `There was a problem with your code: ${e}`;
                } else {
                    return 'unknown error';
                }
            }
        })();

        let styleSheet = `<style>
        code {
            font-family: monospace;
            color: #29D398
        }
        </style>`;

        return styleSheet + '<p><code>' + smlResult
            .replace(/\n/g, '')
            .trim()
            .split('; ')
            .map((val) => val.trim())
            .map((val) => {
                if (!val.endsWith(';')) {
                    return val + ';';
                }
                else {
                    return val;
                }
            })
            .join('</code></p><p><code>') + '</code></p>';
    }
}
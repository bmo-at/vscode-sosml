import * as vscode from 'vscode';

import { SMLView } from "./webview";

export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-sosml is now active');

	let interpretCommand = vscode.commands.registerTextEditorCommand('vscode-sosml.interpret', (textEditor) => {
		if (textEditor.document.languageId !== 'sml') {
			vscode.window.showErrorMessage('Open File is not an SML file');
			return;
		}
		SMLView.createOrShow(textEditor.document);
	});

	let onChangeSMLFile = vscode.workspace.onDidSaveTextDocument((document) => {
		if (document.languageId !== 'sml') { return; }
		if (SMLView.currentView?.isCurrent(document)) { SMLView.createOrShow(document); }
	});

	context.subscriptions.push(interpretCommand, onChangeSMLFile);
}

export function deactivate() { }

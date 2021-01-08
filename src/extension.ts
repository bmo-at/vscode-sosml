import * as vscode from 'vscode';

import { SMLView } from "./webview";

export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-sosml is now active');

	let interpretCommand = vscode.commands.registerTextEditorCommand('vscode-sosml.interpret', async (textEditor) => {
		if (textEditor.document.languageId !== 'sml') {
			vscode.window.showErrorMessage('Open File is not an SML file');
			return;
		}
		createOrUpdate(textEditor.document);
	});

	let onChangeSMLFile = vscode.workspace.onDidSaveTextDocument(async (document) => {
		if (document.languageId !== 'sml') { return; }
		if (SMLView.currentView) { createOrUpdate(document); }
	});

	let onChangeConfig = vscode.workspace.onDidChangeConfiguration((configChangeEvent) => {
		SMLView.configChanged(vscode.workspace.getConfiguration('vscode-sosml'));
	});

	context.subscriptions.push(interpretCommand, onChangeSMLFile, onChangeConfig);
}

export function deactivate() { }

async function createOrUpdate(document: vscode.TextDocument) {
	if (!SMLView.currentView) { SMLView.create(document); } else {
		if (SMLView.currentView.isCurrent(document)) {
			SMLView.update(document);
		} else {
			vscode.window.showInformationMessage("A different file is currently being interpreted. Switch to interpreting this file?");
			if (await vscode.window.showQuickPick(["Yes", "No"]) === "Yes") {
				SMLView.create(document);
			} else { return; }
		}
	}
}
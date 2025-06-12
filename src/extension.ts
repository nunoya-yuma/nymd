import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './markdownEditor';

export function activate(context: vscode.ExtensionContext) {
    // カスタムエディタープロバイダーを登録
    const provider = new MarkdownEditorProvider(context);
    
    const providerRegistration = vscode.window.registerCustomEditorProvider(
        MarkdownEditorProvider.viewType,
        provider
    );
    
    // コマンドを登録
    const openEditorCommand = vscode.commands.registerCommand('nymd.openEditor', (uri?: vscode.Uri) => {
        if (uri) {
            vscode.commands.executeCommand('vscode.openWith', uri, MarkdownEditorProvider.viewType);
        } else {
            vscode.window.showErrorMessage('Please select a markdown file.');
        }
    });
    
    context.subscriptions.push(providerRegistration, openEditorCommand);
}

export function deactivate() {}
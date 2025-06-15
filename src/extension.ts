import * as vscode from 'vscode';
import { MarkdownPreviewProvider } from './markdownEditor';

export function activate(context: vscode.ExtensionContext) {
    // プレビュープロバイダーを作成
    const previewProvider = new MarkdownPreviewProvider(context);
    
    // プレビューコマンドを登録
    const openPreviewCommand = vscode.commands.registerCommand('nymd.openPreview', (uri?: vscode.Uri) => {
        // アクティブなエディタから URI を取得
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        
        if (targetUri && targetUri.fsPath.endsWith('.md')) {
            previewProvider.openPreview(targetUri);
        } else {
            vscode.window.showErrorMessage('Please open a markdown file first.');
        }
    });
    
    context.subscriptions.push(openPreviewCommand);
}

export function deactivate() {}
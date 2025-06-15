import * as vscode from 'vscode';

export class MarkdownPreviewProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    public openPreview(uri: vscode.Uri) {
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
        if (!document) {
            vscode.window.showErrorMessage('Could not find document to preview');
            return;
        }

        // プレビューパネルを作成
        const panel = vscode.window.createWebviewPanel(
            'nymdPreview',
            `Preview: ${document.fileName}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // HTMLコンテンツの設定
        panel.webview.html = this.getHtmlForWebview(document);

        // ドキュメント変更時の処理
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(panel.webview, e.document);
            }
        });

        // クリーンアップ
        panel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private getHtmlForWebview(document: vscode.TextDocument): string {
        const markdownContent = this.markdownToHtml(document.getText());

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYMD Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 16px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            height: 100vh;
            overflow-y: auto;
        }
        .preview-content {
            max-width: none;
            line-height: 1.6;
        }
        .preview-content h1, .preview-content h2, .preview-content h3 {
            color: var(--vscode-editor-foreground);
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .preview-content h1 {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        .preview-content p {
            margin-bottom: 16px;
        }
        .preview-content ul, .preview-content ol {
            margin-bottom: 16px;
            padding-left: 24px;
        }
        .preview-content li {
            margin-bottom: 4px;
        }
        .preview-content code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .preview-content pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            margin-bottom: 16px;
        }
        .preview-content blockquote {
            border-left: 4px solid var(--vscode-panel-border);
            margin: 16px 0;
            padding-left: 16px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="preview-content" id="preview">${markdownContent}</div>

    <script>
        const preview = document.getElementById('preview');

        // VS Codeからのメッセージを受信
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'update':
                    // サーバー側で処理済みのHTMLを直接設定
                    preview.innerHTML = message.html;
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
        webview.postMessage({
            type: 'update',
            html: this.markdownToHtml(document.getText())
        });
    }


    private markdownToHtml(markdown: string): string {
        // 簡単なMarkdownパーサー
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\n/gim, '<br>');
    }

}
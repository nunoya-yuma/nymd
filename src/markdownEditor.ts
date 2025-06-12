import * as vscode from 'vscode';

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'nymd.markdownEditor';

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Webviewの設定
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        // HTMLコンテンツの設定
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

        // ドキュメント変更時の処理
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(webviewPanel.webview, document);
            }
        });

        // Webviewからのメッセージ処理
        webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'edit':
                        this.updateDocument(document, message.text);
                        return;
                }
            },
            null,
            this.context.subscriptions
        );

        // クリーンアップ
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
        const markdownContent = this.markdownToHtml(document.getText());
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYMD Editor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .toolbar {
            display: flex;
            padding: 8px;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            gap: 8px;
        }
        .toolbar button {
            padding: 6px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        .toolbar button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .editor-panel {
            flex: 1;
            padding: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .preview-panel {
            flex: 1;
            padding: 16px;
            border-left: 1px solid var(--vscode-panel-border);
            overflow-y: auto;
            background: var(--vscode-editor-background);
        }
        textarea {
            width: 100%;
            height: 100%;
            background: transparent;
            color: var(--vscode-editor-foreground);
            border: none;
            outline: none;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            resize: none;
            overflow-y: auto;
            flex: 1;
        }
        .preview-content h1, .preview-content h2, .preview-content h3 {
            color: var(--vscode-editor-foreground);
        }
        .preview-content p {
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="insertText('**', '**')">Bold</button>
        <button onclick="insertText('*', '*')">Italic</button>
        <button onclick="insertText('# ', '')">H1</button>
        <button onclick="insertText('## ', '')">H2</button>
        <button onclick="insertText('### ', '')">H3</button>
        <button onclick="insertText('- ', '')">List</button>
    </div>
    <div class="content">
        <div class="editor-panel">
            <textarea id="editor" placeholder="Start typing your Markdown...">${this.escapeHtml(document.getText())}</textarea>
        </div>
        <div class="preview-panel">
            <div class="preview-content" id="preview">${markdownContent}</div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');

        // エディタ変更時の処理
        editor.addEventListener('input', () => {
            const text = editor.value;
            vscode.postMessage({
                type: 'edit',
                text: text
            });
            updatePreview(text);
        });

        // ツールバーのボタン機能
        function insertText(before, after) {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const selectedText = editor.value.substring(start, end);
            const newText = before + selectedText + after;
            
            editor.value = editor.value.substring(0, start) + newText + editor.value.substring(end);
            editor.focus();
            editor.setSelectionRange(start + before.length, start + before.length + selectedText.length);
            
            vscode.postMessage({
                type: 'edit',
                text: editor.value
            });
            updatePreview(editor.value);
        }

        // プレビュー更新
        function updatePreview(text) {
            // 簡単なMarkdownパーサー
            let html = text
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\\*\\*(.*?)\\*\\*/gim, '<strong>$1</strong>')
                .replace(/\\*(.*?)\\*/gim, '<em>$1</em>')
                .replace(/^- (.*$)/gim, '<li>$1</li>')
                .replace(/\\n/gim, '<br>');
            
            preview.innerHTML = html;
        }

        // 同期スクロール機能
        let isEditorScrolling = false;
        let isPreviewScrolling = false;
        
        const previewPanel = document.querySelector('.preview-panel');
        
        // エディタ（textarea）のスクロール同期
        editor.addEventListener('scroll', () => {
            if (isPreviewScrolling) return;
            isEditorScrolling = true;
            
            const editorScrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
            const previewScrollTop = editorScrollRatio * (previewPanel.scrollHeight - previewPanel.clientHeight);
            
            previewPanel.scrollTop = previewScrollTop;
            
            setTimeout(() => { isEditorScrolling = false; }, 100);
        });
        
        // プレビューパネルのスクロール同期
        previewPanel.addEventListener('scroll', () => {
            if (isEditorScrolling) return;
            isPreviewScrolling = true;
            
            const previewScrollRatio = previewPanel.scrollTop / (previewPanel.scrollHeight - previewPanel.clientHeight);
            const editorScrollTop = previewScrollRatio * (editor.scrollHeight - editor.clientHeight);
            
            editor.scrollTop = editorScrollTop;
            
            setTimeout(() => { isPreviewScrolling = false; }, 100);
        });

        // 初期プレビュー更新
        updatePreview(editor.value);
    </script>
</body>
</html>`;
    }

    private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
        webview.postMessage({
            type: 'update',
            text: document.getText()
        });
    }

    private async updateDocument(document: vscode.TextDocument, text: string): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            text
        );
        await vscode.workspace.applyEdit(edit);
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

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
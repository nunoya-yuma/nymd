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

    private getHtmlForWebview(_webview: vscode.Webview, document: vscode.TextDocument): string {
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
        .editor-container {
            display: flex;
            flex: 1;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        .line-numbers {
            background: var(--vscode-editorGutter-background);
            color: var(--vscode-editorLineNumber-foreground);
            font-family: 'Courier New', monospace;
            font-size: 14px;
            padding: 8px 8px 8px 12px;
            text-align: right;
            line-height: 1.5;
            user-select: none;
            min-width: 40px;
            overflow: hidden;
            white-space: pre;
        }
        .preview-panel {
            flex: 1;
            padding: 16px;
            border-left: 1px solid var(--vscode-panel-border);
            overflow-y: auto;
            background: var(--vscode-editor-background);
        }
        textarea {
            flex: 1;
            height: 100%;
            background: transparent;
            color: var(--vscode-editor-foreground);
            border: none;
            outline: none;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            resize: none;
            overflow-y: auto;
            padding: 8px 12px;
            margin: 0;
        }
        .preview-content h1, .preview-content h2, .preview-content h3 {
            color: var(--vscode-editor-foreground);
        }
        .preview-content p {
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
        }
        .search-dialog {
            position: fixed;
            top: 60px;
            right: 20px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: none;
            z-index: 1000;
            min-width: 300px;
        }
        .search-dialog.show {
            display: block;
        }
        .search-input {
            width: 100%;
            padding: 4px 8px;
            margin-bottom: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-size: 13px;
        }
        .search-buttons {
            display: flex;
            gap: 4px;
            margin-bottom: 8px;
        }
        .search-button {
            padding: 4px 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
        }
        .search-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .replace-section {
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 8px;
            margin-top: 8px;
        }
        .search-options {
            display: flex;
            gap: 4px;
            margin-bottom: 8px;
        }
        .option-button {
            padding: 4px 6px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            min-width: 24px;
            text-align: center;
        }
        .option-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .option-button.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
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
            <div class="editor-container">
                <div class="line-numbers" id="line-numbers">1</div>
                <textarea id="editor" placeholder="Start typing your Markdown...">${this.escapeHtml(document.getText())}</textarea>
            </div>
        </div>
        <div class="preview-panel">
            <div class="preview-content" id="preview">${markdownContent}</div>
        </div>
    </div>
    
    <!-- 検索・置換ダイアログ -->
    <div class="search-dialog" id="search-dialog">
        <input type="text" class="search-input" id="search-input" placeholder="検索...">
        <div class="search-options">
            <button class="option-button" id="case-sensitive-btn" onclick="toggleCaseSensitive()" title="大文字小文字を区別">Aa</button>
        </div>
        <div class="search-buttons">
            <button class="search-button" onclick="findNext()">次を検索</button>
            <button class="search-button" onclick="findPrevious()">前を検索</button>
            <button class="search-button" onclick="closeSearch()">閉じる</button>
        </div>
        <div class="replace-section">
            <input type="text" class="search-input" id="replace-input" placeholder="置換...">
            <div class="search-buttons">
                <button class="search-button" onclick="replaceNext()">置換</button>
                <button class="search-button" onclick="replaceAll()">すべて置換</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');
        const lineNumbers = document.getElementById('line-numbers');
        const searchDialog = document.getElementById('search-dialog');
        const searchInput = document.getElementById('search-input');
        const replaceInput = document.getElementById('replace-input');
        const caseSensitiveBtn = document.getElementById('case-sensitive-btn');
        
        let currentSearchIndex = -1;
        let searchMatches = [];
        let caseSensitive = false;

        // 行番号を更新する関数
        function updateLineNumbers() {
            const lines = editor.value.split('\\n');
            const lineCount = lines.length;
            let lineNumbersText = '';
            for (let i = 1; i <= lineCount; i++) {
                lineNumbersText += i + '\\n';
            }
            lineNumbers.textContent = lineNumbersText.trim();
        }

        // 検索・置換機能
        function openSearch() {
            searchDialog.classList.add('show');
            searchInput.focus();
        }

        function toggleCaseSensitive() {
            caseSensitive = !caseSensitive;
            if (caseSensitive) {
                caseSensitiveBtn.classList.add('active');
            } else {
                caseSensitiveBtn.classList.remove('active');
            }
            // 検索結果をリセット
            currentSearchIndex = -1;
            searchMatches = [];
        }

        function closeSearch() {
            searchDialog.classList.remove('show');
            clearSearchHighlight();
        }

        function findMatches(searchText) {
            if (!searchText) return [];
            
            const text = editor.value;
            const matches = [];
            let searchInText, searchForText;
            
            if (caseSensitive) {
                searchInText = text;
                searchForText = searchText;
            } else {
                searchInText = text.toLowerCase();
                searchForText = searchText.toLowerCase();
            }
            
            let index = 0;
            while ((index = searchInText.indexOf(searchForText, index)) !== -1) {
                matches.push({
                    start: index,
                    end: index + searchText.length
                });
                index += searchForText.length;
            }
            
            return matches;
        }

        function findNext() {
            const searchText = searchInput.value;
            if (!searchText) return;
            
            searchMatches = findMatches(searchText);
            if (searchMatches.length === 0) {
                alert('見つかりませんでした');
                return;
            }
            
            currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
            highlightMatch(currentSearchIndex);
        }

        function findPrevious() {
            const searchText = searchInput.value;
            if (!searchText) return;
            
            searchMatches = findMatches(searchText);
            if (searchMatches.length === 0) {
                alert('見つかりませんでした');
                return;
            }
            
            currentSearchIndex = currentSearchIndex <= 0 ? searchMatches.length - 1 : currentSearchIndex - 1;
            highlightMatch(currentSearchIndex);
        }

        function highlightMatch(matchIndex) {
            if (matchIndex < 0 || matchIndex >= searchMatches.length) return;
            
            const match = searchMatches[matchIndex];
            editor.focus();
            editor.setSelectionRange(match.start, match.end);
        }

        function clearSearchHighlight() {
            // 選択を解除
            if (editor.selectionStart !== editor.selectionEnd) {
                editor.setSelectionRange(editor.selectionStart, editor.selectionStart);
            }
        }

        function replaceNext() {
            const searchText = searchInput.value;
            const replaceText = replaceInput.value;
            
            if (!searchText) return;
            
            const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
            const textMatches = caseSensitive ? 
                selectedText === searchText : 
                selectedText.toLowerCase() === searchText.toLowerCase();
                
            if (textMatches) {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                const newValue = editor.value.substring(0, start) + replaceText + editor.value.substring(end);
                
                editor.value = newValue;
                editor.setSelectionRange(start, start + replaceText.length);
                
                // VS Codeドキュメントも更新
                vscode.postMessage({
                    type: 'edit',
                    text: newValue
                });
                updatePreview(newValue);
                updateLineNumbers();
            }
            
            findNext();
        }

        function replaceAll() {
            const searchText = searchInput.value;
            const replaceText = replaceInput.value;
            
            if (!searchText) return;
            
            let newValue, replacedCount;
            
            if (caseSensitive) {
                // 大文字小文字を区別する場合
                const parts = editor.value.split(searchText);
                newValue = parts.join(replaceText);
                replacedCount = parts.length - 1;
            } else {
                // 大文字小文字を区別しない場合（現在は常にfalse）
                const parts = editor.value.split(searchText);
                newValue = parts.join(replaceText);
                replacedCount = parts.length - 1;
            }
            
            if (replacedCount > 0) {
                editor.value = newValue;
                
                // VS Codeドキュメントも更新
                vscode.postMessage({
                    type: 'edit',
                    text: newValue
                });
                updatePreview(newValue);
                updateLineNumbers();
                
                alert(replacedCount + '個置換しました');
            } else {
                alert('置換対象が見つかりませんでした');
            }
        }

        // エディタ変更時の処理
        editor.addEventListener('input', () => {
            const text = editor.value;
            vscode.postMessage({
                type: 'edit',
                text: text
            });
            updatePreview(text);
            updateLineNumbers();
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
            
            // 行番号もエディタと同じスクロール位置に同期
            lineNumbers.scrollTop = editor.scrollTop;
            
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

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            // Ctrl+F で検索ダイアログを開く
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                openSearch();
            }
            // Escapeで検索ダイアログを閉じる
            if (e.key === 'Escape') {
                closeSearch();
            }
        });

        // 検索ボックスでのEnterキー処理
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    findPrevious();
                } else {
                    findNext();
                }
            }
        });

        // 初期プレビュー更新と行番号更新
        updatePreview(editor.value);
        updateLineNumbers();
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
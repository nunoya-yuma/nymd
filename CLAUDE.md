# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 開発コマンド

- `npm install` - 依存関係のインストール
- `npm run compile` - TypeScriptをJavaScriptにコンパイル（テスト前に必須）
- `npm run watch` - ファイル変更を監視して自動コンパイル
- `F5` in VS Code - 拡張機能を開発モードで起動（Extension Development Host）

## 拡張機能のテスト手順

1. `npm run compile` でコードをコンパイル
2. `F5` キーでExtension Development Hostを起動
3. 新しいVS Codeウィンドウで任意の `.md` ファイルを開く
4. 右クリック → "Open with..." → "NYMD Markdown Editor" を選択

## アーキテクチャ概要

VS CodeのCustom Text Editor APIを使用したMarkdownエディタ拡張機能です。以下の構成になっています：

**拡張機能エントリーポイント** (`src/extension.ts`):
- `MarkdownEditorProvider` をVS Codeに登録
- `nymd.openEditor` コマンドを登録
- 拡張機能のアクティベーション処理

**カスタムエディタ実装** (`src/markdownEditor.ts`):
- `vscode.CustomTextEditorProvider` を実装
- Webviewを使用した左右分割インターフェースを作成
- VS CodeドキュメントとWebview間の双方向通信を処理
- エディタUIのHTML/CSS/JavaScriptを埋め込み

**主要な統合ポイント**:
- `vscode.workspace.onDidChangeTextDocument` でドキュメント変更を検知
- `webview.onDidReceiveMessage` でWebview → 拡張機能の通信
- `webview.postMessage` で拡張機能 → Webviewの通信
- `vscode.WorkspaceEdit` APIでドキュメント更新

**Webview構造**:
- 上部にフォーマットボタンを配置したツールバー
- 左側にtextarea、右側にプレビューdivの分割コンテンツエリア
- プレビュー表示用のシンプルな正規表現ベースMarkdownパーサー
- VS Codeテーマとの統合用CSS変数の使用

## 拡張機能マニフェスト

`package.json` にはVS Code拡張機能の設定が含まれています：
- `customEditors` セクションで `.md` ファイル用エディタを登録
- `commands` セクションで "Open NYMD Editor" コマンドを定義
- `activationEvents` でMarkdownファイルでのトリガーを設定
- エントリーポイントは `./out/extension.js`（TypeScriptからコンパイル）
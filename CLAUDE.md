# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 開発ワークフロー（重要）

**⚠️ 必須ルール: 全ての変更は新しいブランチで実施すること**

1. **作業開始前に必ずブランチを作成**:
   ```bash
   git checkout -b feature/機能名
   # または
   git checkout -b fix/修正内容
   ```

2. **開発・テスト・コミット**を実施

3. **リモートにプッシュ**:
   ```bash
   git push -u origin ブランチ名
   ```

4. **mainブランチへのマージ（rebaseを使用）**:
   ```bash
   # mainブランチを最新に更新
   git checkout main
   git pull origin main
   
   # featureブランチをmainにrebase
   git checkout feature/ブランチ名
   git rebase main
   
   # mainにマージ（fast-forward）
   git checkout main
   git merge feature/ブランチ名
   
   # リモートにプッシュ
   git push origin main
   
   # 不要になったブランチを削除
   git branch -d feature/ブランチ名
   git push origin --delete feature/ブランチ名
   ```

5. **Pull Requestを使用する場合**:
   - GitHub上でPull Requestを作成
   - レビュー後、「Rebase and merge」を選択してマージ

**ブランチ命名規則**:
- `feature/機能名` - 新機能追加
- `fix/修正内容` - バグ修正  
- `refactor/改善内容` - リファクタリング
- `docs/ドキュメント更新` - ドキュメント修正

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
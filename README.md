# NYMD - Markdown Editor

A WYSIWYG-style Markdown editor extension for Visual Studio Code with live preview and toolbar controls.

## Features

- **Split-pane interface**: Markdown editor on the left, live preview on the right
- **Toolbar controls**: Quick access buttons for common formatting (Bold, Italic, Headings, Lists)
- **Real-time preview**: Instant preview updates as you type
- **VS Code theme integration**: Automatically adapts to your VS Code color theme

## Installation

### Development Mode

1. Clone this repository
2. Open the project in VS Code
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile the TypeScript code:
   ```bash
   npm run compile
   ```
5. Press `F5` to launch the extension in development mode

## Usage

1. Open any Markdown file (`.md`) in VS Code
2. Right-click on the file and select "Open with..."
3. Choose "NYMD Markdown Editor"
4. The editor will open with:
   - Left pane: Markdown source editor
   - Right pane: Live preview
   - Top toolbar: Formatting buttons

### Toolbar Functions

- **Bold**: Wrap selected text with `**bold**`
- **Italic**: Wrap selected text with `*italic*`
- **H1, H2, H3**: Insert heading markers
- **List**: Insert list item marker (`-`)

## Development

### Project Structure

```
nymd/
├── src/
│   ├── extension.ts      # Main extension entry point
│   └── markdownEditor.ts # Custom editor implementation
├── out/                  # Compiled JavaScript files
├── .vscode/
│   └── launch.json      # VS Code debug configuration
├── package.json         # Extension manifest
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

### Scripts

- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile automatically

### Architecture

- **Custom Editor API**: Uses VS Code's Custom Text Editor API
- **Webview**: Preview pane implemented using VS Code Webview
- **Message Passing**: Communication between editor and webview via messages

## Roadmap

- [ ] Synchronized scrolling between editor and preview
- [ ] Enhanced Markdown parser with more features
- [ ] Additional toolbar functions (links, images, tables)
- [ ] Keyboard shortcuts
- [ ] Export functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## License

MIT License
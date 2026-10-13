# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-10-14

### Changed

- Calmer borders in Zacess Yellow on Black: the borders, dividers and outlines that only separate areas are a neutral grey (`#7a7a7a`, 4.8:1 on black) in VS Code, the JetBrains IDEs, Obsidian, Zed, Neovim and kitty. Yellow stays for focus, the active tab, selections, buttons and badges, which now share that one yellow accent.
- Zacess Yellow on Black terminals draw their default text in white with a yellow cursor, so yellow and other light ANSI output no longer blends into normal text. ANSI white is `#d9d9d9` so it stays distinct from the default text. This covers VS Code, the JetBrains console, Zed, iTerm2, Alacritty, kitty, Ghostty and Windows Terminal.
- Calmer chrome in Zacess Cream: the side bar, activity bar, title bar, status bar and tabs use a quieter warm neutral, while the editor, the terminal and reading surfaces keep the cream `#fdf6e3`.
- A new `borderActive` palette role for focus and active borders, so each theme keeps one accent for focus and active states.
- The checks hold every border and divider role, focus and active borders and every border, outline and separator key in the generated VS Code themes to 3:1 on each surface they divide, require every ANSI colour to stay distinct from the terminal's default text and require every fallback sensitive VS Code key to be set with its text at 7:1.

### Fixed

- Zacess Cream in VS Code now builds on the normal light base instead of the high contrast light one. Every theme now sets the inline code, code block, quote, separator, hover, notification, quick input, menu, list, input, dropdown, badge, button and keybinding colours itself. Inline code in Markdown previews and extension pages, which showed dark green on navy in Cream, is readable again.

## [0.1.0] - 2026-10-14

### Added

- Four themes matching the Zacess reader's contrast themes: Zacess Light, Zacess Dark, Zacess Yellow on Black for low vision and Zacess Cream for dyslexia friendly reading.
- One palette in `palette/zacess.json` with a JSON schema, holding the interface, syntax and terminal colours of every theme, the font style of each token and the floors the checks enforce.
- A generator that writes a VS Code extension, a JetBrains theme plugin with editor colour schemes, an Obsidian theme with Style Settings options, Neovim colour schemes, a Zed theme extension and iTerm2, Alacritty, kitty, Ghostty and Windows Terminal themes.
- Checks that hold every text and syntax colour to 7:1 contrast on the background, the selection, the current line and the diff backgrounds, test paired tokens for tone and under simulated protanopia, deuteranopia and tritanopia and parse every generated file.
- SVG previews drawn as real text and the data for the themes page on the Zacess website.
- CI that runs the checks, proves the committed files are current, packages the VS Code extension and builds the JetBrains plugin. A release workflow that attaches the `.vsix`, the JetBrains zip and an Obsidian zip to each GitHub release and publishes to each marketplace once its token is set.

[Unreleased]: https://github.com/zacesshq/themes/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/zacesshq/themes/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0

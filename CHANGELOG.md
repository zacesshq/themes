# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-14

### Added

- Four themes matching the Zacess reader's contrast themes: Zacess Light, Zacess Dark, Zacess Yellow on Black for low vision and Zacess Cream for dyslexia friendly reading.
- One palette in `palette/zacess.json` with a JSON schema, holding the interface, syntax and terminal colours of every theme, the font style of each token and the floors the checks enforce.
- A generator that writes a VS Code extension, a JetBrains theme plugin with editor colour schemes, an Obsidian theme with Style Settings options, Neovim colour schemes, a Zed theme extension and iTerm2, Alacritty, kitty, Ghostty and Windows Terminal themes.
- Checks that hold every text and syntax colour to 7:1 contrast on the background, the selection, the current line and the diff backgrounds, test paired tokens for tone and under simulated protanopia, deuteranopia and tritanopia and parse every generated file.
- SVG previews drawn as real text and the data for the themes page on the Zacess website.
- CI that runs the checks, proves the committed files are current, packages the VS Code extension and builds the JetBrains plugin. A release workflow that attaches the `.vsix`, the JetBrains zip and an Obsidian zip to each GitHub release and publishes to each marketplace once its token is set.

[Unreleased]: https://github.com/zacesshq/themes/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0

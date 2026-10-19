# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The release workflow only builds, publishes to the stores and keeps the built files as a workflow artifact. A maintainer then runs `scripts/release.mjs`, which creates the GitHub release and updates zacesshq/obsidian-theme and zacesshq/zacess.nvim with signed commits, signed annotated tags and releases. CONTRIBUTING.md describes the steps.

## [0.2.1] - 2026-10-19

### Fixed

- The JetBrains Marketplace listing shows these update notes: the plugin build takes its change notes from this changelog's section for the version. A version with no section fails the build.
- The releases in zacesshq/obsidian-theme and zacesshq/zacess.nvim carry this changelog's section as their notes instead of a single line.

### Changed

- Includes the two high contrast themes from 0.2.0, Zacess High Contrast Dark and Zacess High Contrast Light, for every editor and terminal.

## [0.2.0] - 2026-10-19

### Added

- Zacess High Contrast Dark: white on pure black with strong grey borders, a yellow accent and a yellow focus ring, for the highest contrast on a dark screen. Every syntax colour keeps 10.5:1 or more on the background.
- Zacess High Contrast Light: black on pure white with strong dark borders and deep blue focus outlines, for the highest contrast on a light screen. Every syntax colour keeps 9:1 or more on the background.
- Both themes ship for every editor and terminal: VS Code (on the high contrast bases), the JetBrains IDEs, Obsidian (through the Style Settings contrast option), Neovim, Zed, Sublime Text, Helix, Emacs, iTerm2, Alacritty, kitty, Ghostty and Windows Terminal, with previews and issue form options.

### Changed

- Every install guide, store description and issue form names all six themes.
- zacess.nvim is listed in awesome-neovim, so the README and the Neovim guide link to the listing.
- Releases publish to the VS Code Marketplace through a Microsoft Entra identity that trusts this repository's `release` environment, so no Marketplace access token is stored. A manual workflow checks the identity's publish rights.
- Releases publish to Open VSX through trusted publishing: the registry accepts this repository's release workflow directly, so no Open VSX access token is stored as a secret.
- Zacess Themes is on the JetBrains Marketplace, so the JetBrains install guides install from there first. The plugin zip on each release stays available for offline installs.
- Zacess Themes is in the Zed extension store, so the Zed install guides point there first. The dev extension and the copied theme file stay as ways to try unreleased changes.

## [0.1.5] - 2026-10-14

### Changed

- ANSI black in Zacess Dark and Zacess Yellow on Black is a mid grey (`#a3a3a3`) instead of a near black, so text a program prints in black stays readable at 7:1 or more. Bright black moves to `#c8c8c8` so the two stay apart. Every one of the 16 terminal colours in every theme is now measured as text on the background, with no exceptions, which lets terminal theme catalogues grade all four themes AAA.
- The install guides note that the four themes are in the iTerm2 Color Schemes collection, which Ghostty, WezTerm and other terminals draw from.

## [0.1.4] - 2026-10-14

### Added

- Sublime Text colour schemes in `editors/sublime`, one `.sublime-color-scheme` per theme. Each names the palette colours as variables, sets the editor colours and maps the same TextMate scopes as the VS Code themes, with bold, italic and underline from the palette's font styles.
- Helix themes in `editors/helix/themes`, one per theme, with a `[palette]` table and the interface, diagnostic, diff, Markdown and syntax scopes. Font styles map to Helix modifiers and underlines.
- Emacs themes in `editors/emacs`, one `deftheme` file per theme, covering the default, region, current line, line number, mode line, search, parenthesis, diff, Flymake and Flycheck faces, every `font-lock` face and the 16 `ansi-color` faces. Each file adds its folder to `custom-theme-load-path` when loaded.
- `npm run check` parses the new files: the Sublime Text schemes as JSON, the Helix themes as TOML and the Emacs themes by their brackets. It also proves that every colour, variable and palette name they use comes from the palette.
- Each release attaches `zacess-sublime-<version>.zip`, `zacess-helix-<version>.zip` and `zacess-emacs-<version>.zip`.
- Each release updates two read-only copies with a matching release in each: [zacesshq/obsidian-theme](https://github.com/zacesshq/obsidian-theme) for the Obsidian community directory and [zacesshq/zacess.nvim](https://github.com/zacesshq/zacess.nvim) for Neovim plugin managers.

### Changed

- The install guides link the [Obsidian community directory](https://community.obsidian.md/themes/zacess) listing and install Neovim from `zacesshq/zacess.nvim`.

## [0.1.3] - 2026-10-14

### Changed

- The install guides link the VS Code Marketplace, Open VSX and JetBrains Marketplace listings. The VS Code guide installs by extension ID instead of a downloaded file. The release files stay available for offline installs.

## [0.1.2] - 2026-10-14

### Changed

- Fewer greens in Zacess Yellow on Black: types and classes are lavender (`#e5c7ff`) instead of light green in VS Code, the JetBrains IDEs, Zed and Neovim, so strings are the only green in code.
- Zacess Yellow on Black in VS Code draws inline code in white, for example in Markdown previews, hovers, settings and extension pages, instead of the string green.
- A new optional `code` palette role sets the inline code colour. A theme without it keeps the string colour.

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

[Unreleased]: https://github.com/zacesshq/themes/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/zacesshq/themes/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zacesshq/themes/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/zacesshq/themes/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/zacesshq/themes/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/zacesshq/themes/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/zacesshq/themes/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/zacesshq/themes/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Xcode themes in `editors/xcode`, one `.xccolortheme` per theme, copied into `~/Library/Developer/Xcode/UserData/FontAndColorThemes` and imported with Import Classic Theme under Settings, Themes in Xcode 27 or chosen there directly in Xcode 26 and earlier. Each sets the colour and font of every Xcode syntax type, the editor background, cursor, selection, current line, invisible characters and the debugger's current line, the console, rendered documentation and the scroll bar marks. Keywords are bold, comments italic and documentation tags bold italic. Every key was confirmed against the themes Xcode 27.1 ships.
- `npm run check` parses the Xcode themes, refuses any key Xcode's own themes do not use and proves every colour in them comes from the palette.
- An Eclipse plugin, `com.zacess.themes.eclipse`, that adds the eight themes to **General**, **Appearance**, **Theme**, installed from the update site at https://zacesshq.github.io/themes/eclipse/. Each theme builds on Eclipse's Light or Dark window and sets the same editor and Terminal colours as its `.epf` file, plus the Console's background, output, error and input colours. `scripts/build.mjs` writes the plugin, the feature and the update site build from the palette.
- The Eclipse update site shows a short install page to anyone opening its address in a browser. The Pages root forwards to the repository.
- A workflow that builds the update site with Maven and Tycho and publishes it to GitHub Pages on each release. A CI job builds it on every pull request.

## [0.3.0] - 2026-10-21

### Added

- Zacess Deep Contrast Dark: white on pure black with deep, fully saturated syntax colours, cyan frames and yellow focus outlines and find boxes, for low vision. Keywords, comments and numbers sit at 9:1 on the background and paired tokens step up in lightness from there.
- Zacess Deep Contrast Light: black on pure white with vivid deep syntax colours, navy frames and red focus outlines and find boxes, for low vision. Syntax colours sit between 7.7:1 and 15:1 so they stay vivid, with a faint blue selection every token keeps 7:1 over.
- Both Deep Contrast themes for every editor and terminal: VS Code, the JetBrains IDEs, Obsidian, Neovim, Zed, Sublime Text, Helix, Emacs, Eclipse, iTerm2, Alacritty, kitty, Ghostty and Windows Terminal.
- Eclipse preference files in `editors/eclipse`, one `.epf` per theme, imported with File, Import, Preferences. Each sets the Java editor's syntax colours and font styles, Javadoc and task tags, Java semantic highlighting, the properties file editor and the shared text editor colours: background, text, selection, current line, line numbers, links, marked occurrences, search results, problem underlines and quick diff marks, plus the Terminal view's 16 colours, text, background and selection. Marked occurrences and search results are boxed in the find match border colour. Every key was confirmed against Eclipse 4.41.
- `npm run check` parses the Eclipse files, proves every colour in them comes from the palette and refuses an export root line, which would clear a user's other preferences on import.

### Changed

- The syntax and terminal colours of every theme are now fully saturated at unchanged contrast. Each coloured token, ANSI colour, link and error colour has its OKLab chroma raised to the edge of the sRGB gamut while its luminance and hue stay fixed, so every contrast ratio is exactly as before. Text and the black, white and grey terminal slots stay neutral. `scripts/saturate.mjs` applies the change to the palette and can be run again safely.
- Comments have a real colour instead of grey in Zacess Light, Dark, Yellow on Black, Cream, High Contrast Dark and High Contrast Light: in each theme the hue furthest from every other syntax colour, in normal vision and under simulated protanopia, deuteranopia and tritanopia, fully saturated and still at 7:1 or more on every text surface. Comments stay italic.
- The coloured terminal slots in the four light themes (ANSI 1 to 6 and 9 to 14) use the 4.5:1 terminal allowance so they stay vivid instead of reading as black, with each bright colour a step lighter than its normal form. Their black, white and grey slots keep 7:1 and every code colour keeps 7:1 or more.
- Zacess Deep Contrast Light keeps its terminal green, yellow, bright green and bright yellow at 4.5:1, the documented `rules.ansiFloor` allowance, because at 7:1 they read as black on white. ACCESSIBILITY.md lists them.
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

[Unreleased]: https://github.com/zacesshq/themes/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/zacesshq/themes/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/zacesshq/themes/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zacesshq/themes/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/zacesshq/themes/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/zacesshq/themes/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/zacesshq/themes/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/zacesshq/themes/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/zacesshq/themes/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0

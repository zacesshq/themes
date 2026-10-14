# Changelog

All notable changes to the Zacess Themes extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-10-14

### Changed

- In Zacess Dark and Zacess Yellow on Black, the integrated terminal's ANSI black is a readable mid grey, so text printed in black no longer disappears.

## [0.1.4] - 2026-10-14

### Changed

- No changes to the VS Code themes. This release adds Sublime Text, Helix and Emacs versions in the [zacesshq/themes](https://github.com/zacesshq/themes) repository.

## [0.1.3] - 2026-10-14

### Changed

- The extension page links the VS Code Marketplace and Open VSX listings and explains installing from the Extensions view.

## [0.1.2] - 2026-10-14

### Changed

- Zacess Yellow on Black draws types and classes in lavender instead of light green, so strings are the only green in code.
- Zacess Yellow on Black draws inline code in white in Markdown previews, hovers, settings and extension pages.

## [0.1.1] - 2026-10-14

### Changed

- Zacess Yellow on Black draws the borders, dividers and outlines that only separate areas in a neutral grey, including `contrastBorder`. Yellow stays for focus (`focusBorder` and `contrastActiveBorder`), the active tab, selected list items, buttons and badges.
- Zacess Yellow on Black draws the integrated terminal's default text in white with a yellow cursor, so yellow warnings and other light ANSI output stand apart from normal text. ANSI white is a light grey so it stays distinct too.
- Zacess Cream keeps cream for the editor and the terminal and uses a quieter warm neutral for the side bar, activity bar, title bar, status bar and tabs.
- Each theme uses one accent for focus and active states.

### Fixed

- Zacess Cream builds on the normal light base instead of the high contrast light one. Every theme now sets the inline code, code block, quote, hover, notification, quick input, menu, list, input, dropdown, badge, button and keybinding colours itself. Inline code in Markdown previews and extension pages is readable in Cream again.

## [0.1.0] - 2026-10-14

### Added

- Zacess Light, Zacess Dark, Zacess Yellow on Black and Zacess Cream, matching the four contrast themes in the Zacess reader.
- Editor, workbench, terminal and semantic token colours, with every text and syntax colour at 7:1 contrast or more.
- Bold keywords, italic comments and parameters and underlined invalid code, so colour is never the only signal.

[0.1.5]: https://github.com/zacesshq/themes/releases/tag/v0.1.5
[0.1.4]: https://github.com/zacesshq/themes/releases/tag/v0.1.4
[0.1.3]: https://github.com/zacesshq/themes/releases/tag/v0.1.3
[0.1.2]: https://github.com/zacesshq/themes/releases/tag/v0.1.2
[0.1.1]: https://github.com/zacesshq/themes/releases/tag/v0.1.1
[0.1.0]: https://github.com/zacesshq/themes/releases/tag/v0.1.0

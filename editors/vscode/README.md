# Zacess Themes

Four high contrast code themes that match the [Zacess](https://zacess.com) reader, so a student sees
the same page in the reader and in the editor. Every text and syntax colour keeps at least 7:1
contrast (WCAG AAA) on the background, the selection and the current line, comments included.

| Theme | For | Text on background |
| --- | --- | --- |
| Zacess Light | Everyday use in a bright room | `#111111` on `#ffffff` |
| Zacess Dark | Everyday use in a dim room | `#f5f5f5` on `#121212` |
| Zacess Yellow on Black | Low vision | `#ffeb3b` on `#000000` |
| Zacess Cream | Dyslexia friendly reading | `#000000` on `#fdf6e3` |

![Zacess Light: TypeScript, Python, Rust and HTML lines in dark colours on white, with keywords in bold and comments in italics](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-light.png)

![Zacess Dark: the same code in light colours on near black](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-dark.png)

![Zacess Yellow on Black: the same code in yellow, white and pale colours on black](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-yellow-on-black.png)

![Zacess Cream: the same code in dark colours on a cream background](https://raw.githubusercontent.com/zacesshq/themes/main/previews/zacess-cream.png)

## Colour is never the only signal

- Keywords, control flow and markup tags are **bold**.
- Comments and parameters are *italic*.
- Invalid code is underlined.
- Tokens that often sit side by side differ in lightness or font style, not only in hue. Strings and
  numbers, added and removed lines and other red and green pairs are checked under simulated
  protanopia, deuteranopia and tritanopia.

## Install

1. Search for **Zacess Themes** in the Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X`
   elsewhere) and select **Install**. It is on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=zacess.zacess-themes)
   and, for Cursor, Windsurf, VSCodium, Antigravity, Kiro and other editors built on VS Code, on
   [Open VSX](https://open-vsx.org/extension/zacess/zacess-themes).
2. Run **Preferences: Color Theme** (`Cmd+K Cmd+T` on macOS, `Ctrl+K Ctrl+T` elsewhere) and pick a
   Zacess theme.

From a terminal the first step is:

```sh
code --install-extension zacess.zacess-themes
```

To install offline, download `zacess-themes-<version>.vsix` from the
[latest release](https://github.com/zacesshq/themes/releases/latest) and run
**Extensions: Install from VSIX...**.

## More

The contrast tables, the palette and the same themes for JetBrains IDEs, Obsidian, Neovim, Zed and
terminals are in the [zacesshq/themes](https://github.com/zacesshq/themes) repository.

## Licence

[MIT](LICENSE).

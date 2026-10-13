# Zacess for Zed

A Zed theme extension with Zacess Light, Zacess Dark, Zacess Yellow on Black and Zacess Cream in one
theme family, in `themes/zacess.json`.

## Install

Either install this folder as a dev extension:

1. Open the command palette and run **zed: install dev extension**.
2. Choose this `editors/zed` folder.

Or copy the theme file on its own:

```sh
mkdir -p ~/.config/zed/themes
cp themes/zacess.json ~/.config/zed/themes/
```

Then run **theme selector: toggle** and choose a Zacess theme.

> [!NOTE]
> Zed's theme format has no underline for syntax tokens, so invalid code relies on Zed's own
> diagnostic underline. Bold keywords and italic comments and parameters work as in every other
> editor.

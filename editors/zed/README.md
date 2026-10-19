# Zacess for Zed

A Zed theme extension with Zacess Light, Zacess Dark, Zacess Yellow on Black, Zacess Cream, Zacess
High Contrast Dark and Zacess High Contrast Light in one theme family, in `themes/zacess.json`.

## Install

Zacess Themes is in the [Zed extension store](https://zed.dev/extensions?query=zacess):

1. Open the command palette and run **zed: extensions**.
2. Search for **Zacess Themes** and click **Install**.

To try changes from this repository before they are released, install this folder as a dev extension
instead:

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

# Zacess for terminals

The four Zacess themes for iTerm2, Alacritty, kitty, Ghostty and Windows Terminal. Every one of the
16 terminal colours keeps at least 7:1 contrast on the background. In the two dark themes, ANSI black
is a background shade rather than a text colour, so it is checked the other way round: the theme's
text keeps 7:1 on it.

| Terminal | Files | Install |
| --- | --- | --- |
| iTerm2 | [`iterm2/`](iterm2/) | **Settings**, **Profiles**, **Colors**, then **Color Presets...** and **Import...**. Choose the `.itermcolors` file, then pick it from the same menu |
| Alacritty | [`alacritty/`](alacritty/) | Copy the file to `~/.config/alacritty/` and add `import = ["~/.config/alacritty/zacess-dark.toml"]` under `[general]` in `alacritty.toml` |
| kitty | [`kitty/`](kitty/) | Copy the file to `~/.config/kitty/` and add `include zacess-dark.conf` to `kitty.conf` |
| Ghostty | [`ghostty/`](ghostty/) | Copy the files to `~/.config/ghostty/themes/` and add `theme = light:zacess-light,dark:zacess-dark` to the config to follow the system appearance |
| Windows Terminal | [`windows-terminal/zacess.json`](windows-terminal/zacess.json) | Open **Settings**, then **Open JSON file**. Add the four objects to the `schemes` list, then set `"colorScheme": "Zacess Dark"` in a profile |

The full colour table with every measured ratio is in
[ACCESSIBILITY.md](../../ACCESSIBILITY.md#terminal-colours).

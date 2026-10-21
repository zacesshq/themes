# Zacess for terminals

The eight Zacess themes for iTerm2, Alacritty, kitty, Ghostty and Windows Terminal. In the dark
themes every one of the 16 terminal colours keeps at least 7:1 contrast on the background, ANSI
black included: in Zacess Dark, Zacess Yellow on Black and Zacess High Contrast Dark it is a mid
grey, so text a program prints in black stays readable. Zacess Deep Contrast Dark keeps ANSI black true black for use as a
background. The light themes keep their coloured slots vivid at the 4.5:1 terminal allowance, since
at 7:1 they would read as black, while their black, white and grey slots keep 7:1.
[ACCESSIBILITY.md](../../ACCESSIBILITY.md#terminal-colours) explains both.

> [!NOTE]
> Zacess Light, Zacess Dark, Zacess Yellow on Black and Zacess Cream are also in the
> [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) collection, which ships
> ports for dozens more terminals. The two high contrast themes have been submitted to it. The two Deep Contrast
> themes are not in it yet.
> Terminals that bundle that collection, such as Ghostty and WezTerm, list them by name from their
> next update.

| Terminal | Files | Install |
| --- | --- | --- |
| iTerm2 | [`iterm2/`](iterm2/) | **Settings**, **Profiles**, **Colors**, then **Color Presets...** and **Import...**. Choose the `.itermcolors` file, then pick it from the same menu |
| Alacritty | [`alacritty/`](alacritty/) | Copy the file to `~/.config/alacritty/` and add `import = ["~/.config/alacritty/zacess-dark.toml"]` under `[general]` in `alacritty.toml` |
| kitty | [`kitty/`](kitty/) | Copy the file to `~/.config/kitty/` and add `include zacess-dark.conf` to `kitty.conf` |
| Ghostty | [`ghostty/`](ghostty/) | Copy the files to `~/.config/ghostty/themes/` and add `theme = light:zacess-light,dark:zacess-dark` to the config to follow the system appearance |
| Windows Terminal | [`windows-terminal/zacess.json`](windows-terminal/zacess.json) | Open **Settings**, then **Open JSON file**. Add the eight objects to the `schemes` list, then set `"colorScheme": "Zacess Dark"` in a profile |

The full colour table with every measured ratio is in
[ACCESSIBILITY.md](../../ACCESSIBILITY.md#terminal-colours).

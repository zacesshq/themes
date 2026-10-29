# Command colours in your shell

Shell syntax highlighting can name the terminal's ANSI colours instead of fixed values, so commands
follow whichever Zacess theme is active: commands in green, unknown commands in red, quoted text in
yellow and options in cyan. Every ANSI colour keeps at least 4.5:1 on the background in every theme.

For [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting), add this to
`~/.zshrc` after the plugin loads:

```zsh
typeset -gA ZSH_HIGHLIGHT_STYLES
ZSH_HIGHLIGHT_STYLES[command]='fg=green'
ZSH_HIGHLIGHT_STYLES[alias]='fg=green'
ZSH_HIGHLIGHT_STYLES[function]='fg=green'
ZSH_HIGHLIGHT_STYLES[builtin]='fg=green'
ZSH_HIGHLIGHT_STYLES[precommand]='fg=green'
ZSH_HIGHLIGHT_STYLES[unknown-token]='fg=red'
ZSH_HIGHLIGHT_STYLES[single-quoted-argument]='fg=yellow'
ZSH_HIGHLIGHT_STYLES[double-quoted-argument]='fg=yellow'
ZSH_HIGHLIGHT_STYLES[dollar-quoted-argument]='fg=yellow'
ZSH_HIGHLIGHT_STYLES[single-hyphen-option]='fg=cyan'
ZSH_HIGHLIGHT_STYLES[double-hyphen-option]='fg=cyan'
ZSH_HIGHLIGHT_STYLES[default]='none'
```

For fish, run this once. The settings are saved as universal variables:

```fish
set -U fish_color_command green
set -U fish_color_error red
set -U fish_color_quote yellow
set -U fish_color_param normal
set -U fish_color_option cyan
```

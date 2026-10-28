# Installs the eight Zacess colour schemes for Windows Terminal as a settings fragment, so the
# settings file itself is never edited.
#
#   irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 | iex
#
# Set $env:ZACESS_THEMES_REF to a tag such as v0.6.0 to install that release instead of main.

$ErrorActionPreference = 'Stop'
$ref = if ($env:ZACESS_THEMES_REF) { $env:ZACESS_THEMES_REF } else { 'main' }
$url = "https://raw.githubusercontent.com/zacesshq/themes/$ref/editors/terminals/windows-terminal/zacess.json"
$folder = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows Terminal\Fragments\Zacess'

New-Item -ItemType Directory -Force -Path $folder | Out-Null
Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile (Join-Path $folder 'zacess.json')

Write-Output "Copied the eight Zacess colour schemes to $folder"
Write-Output 'To turn one on, restart Windows Terminal, open Settings, choose a profile, then Appearance, Color scheme.'

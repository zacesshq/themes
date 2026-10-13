# Contributing to the Zacess themes

Thank you for helping make code easier to read. This guide covers how a change to the themes is made
and checked.

## How a change happens

1. Every change starts from an issue that says what "done" means. A readability problem uses the
   [readability form](https://github.com/zacesshq/themes/issues/new?template=readability.yml).
2. Work on a branch named after its type and topic, such as `fix/dark-comment-contrast` or
   `feat/helix-theme`.
3. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`,
   `fix:`, `docs:`, `refactor:` and `chore:`.
4. Open a pull request that closes its issue. It is squash-merged once the checks pass and it is
   reviewed.

## Changing a colour

> [!IMPORTANT]
> Every colour lives in `palette/zacess.json`. Never edit a generated file by hand: the next build
> overwrites it and `npm run verify` fails until the palette and the files agree.

The generated files are everything under `editors/` except the hand-written READMEs, the VS Code
README and changelog, the icon and the JetBrains Gradle build, plus `previews/` and the tables
between the markers in `README.md` and `ACCESSIBILITY.md`.

With Node.js 24 installed:

```sh
# 1. change palette/zacess.json, then write every editor's files from it
npm run build

# 2. measure contrast, test the paired tokens and parse every generated file
npm run check

# 3. redraw the previews and the website data, then look at the previews
npm run preview

# 4. prove nothing generated is left out of the commit
npm run verify
```

Commit the palette change together with every file the build and the previews rewrote. When a check
fails it prints a table naming the theme, the colour, the surface and the floor it missed.

## Adding an editor

Add a function to `scripts/build.mjs` that writes the editor's files from the palette, use the
existing token names so the font styles carry over, add a parse check for the new file type to
`scripts/check.mjs` and document the install step in the editor's own README and in the root
README.

## Project conventions

- **Contrast is a requirement.** Every text and syntax colour keeps 7:1 on every surface it is drawn
  on. A change that lowers a ratio below a floor cannot merge.
- **Colour is never the only signal.** Keep keywords bold, comments and parameters italic and invalid
  code underlined. Two tokens that sit side by side must differ in tone or font style, not only in
  hue.
- **No runtime dependencies.** The scripts run on a bare Node.js install so anyone can check a
  change.
- Documentation uses UK English.

## Building the editor packages

- VS Code: `npx @vscode/vsce@4.0.0 package --no-dependencies` in `editors/vscode`.
- JetBrains: `./gradlew buildPlugin` in `editors/jetbrains`, with Java 21.

CI runs both on every pull request.

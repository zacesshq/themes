# Workflows

| Workflow | Runs on | What it does |
| --- | --- | --- |
| [`ci.yml`](ci.yml) | Push to `main` and pull requests | **Palette and contrast** runs `npm run check`, which measures every colour against the contrast floors, tests the paired tokens under simulated colour vision deficiencies and parses every generated file, then `npm run verify`, which rebuilds every file from the palette and fails if anything committed differs. **VS Code package** packages the extension with `@vscode/vsce` and uploads the `.vsix`. **JetBrains plugin** builds the plugin with `./gradlew buildPlugin` on Java 21 and uploads the zip |
| [`release.yml`](release.yml) | A tag starting with `v`, such as `v0.1.0` | Runs the checks, confirms the tag matches the palette version, builds the `.vsix`, the JetBrains zip and an Obsidian zip and creates the GitHub release with them, using this version's changelog section as the notes. Publishes to the VS Code Marketplace, Open VSX and the JetBrains Marketplace only when the `VSCE_PAT`, `OVSX_PAT` or `JETBRAINS_TOKEN` secret exists. Each missing secret skips its step with a line in the run summary |
| [`markdownlint.yml`](markdownlint.yml) | Push to `main` and pull requests, also run by hand | Lints every markdown file with the rules in `.markdownlint.json` |

Every action is pinned to a full commit SHA with its version in a comment. Dependabot proposes updates
weekly.

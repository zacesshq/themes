# Workflows

| Workflow | Runs on | What it does |
| --- | --- | --- |
| [`ci.yml`](ci.yml) | Push to `main` and pull requests | **Palette and contrast** runs `npm run check`, which measures every colour against the contrast floors, tests the paired tokens under simulated colour vision deficiencies and parses every generated file, then `npm run verify`, which rebuilds every file from the palette and fails if anything committed differs. **VS Code package** packages the extension with `@vscode/vsce` and uploads the `.vsix`. **JetBrains plugin** builds the plugin with `./gradlew buildPlugin` on Java 21 and uploads the zip |
| [`release.yml`](release.yml) | A tag starting with `v`, such as `v0.1.0` | Runs the checks, confirms the tag matches the palette version, builds the `.vsix`, the JetBrains zip and an Obsidian zip and creates the GitHub release with them, using this version's changelog section as the notes. The JetBrains plugin build takes the same section as its Marketplace change notes and the releases in the read-only Obsidian and Neovim copies carry it too. Runs in the `release` environment. Publishes to the VS Code Marketplace through a Microsoft Entra identity and to Open VSX through trusted publishing, both with no stored token. Publishes to the JetBrains Marketplace only when the `JETBRAINS_TOKEN` secret exists, otherwise that step is skipped with a line in the run summary |
| [`marketplace-identity.yml`](marketplace-identity.yml) | Run by hand | Signs in as the Microsoft Entra identity the release uses, prints its Azure DevOps profile id and checks it can publish to the `zacess` publisher on the VS Code Marketplace. Publishes nothing |
| [`markdownlint.yml`](markdownlint.yml) | Push to `main` and pull requests, also run by hand | Lints every markdown file with the rules in `.markdownlint.json` |

Every action is pinned to a full commit SHA with its version in a comment. Dependabot proposes updates
weekly.

# Zacess Themes for JetBrains IDEs

A theme plugin for IntelliJ IDEA, PyCharm, WebStorm, CLion, Rider and the other JetBrains IDEs
built on the IntelliJ Platform 2025.3 or later. Each of the four themes pairs an interface theme
(`*.theme.json`) with a matching editor colour scheme (`*.icls`) that uses the same token colours and
font styles as every other Zacess theme.

## Install

1. Download `zacess-themes-<version>.zip` from the
   [latest release](https://github.com/zacesshq/themes/releases/latest).
2. Open **Settings**, then **Plugins**, select the gear icon and choose **Install Plugin from Disk...**.
   Pick the zip and restart the IDE if asked.
3. Open **Settings**, then **Appearance & Behavior**, then **Appearance** and choose a Zacess theme.
   The matching editor colour scheme switches with it.

> [!NOTE]
> The [JetBrains Marketplace listing](https://plugins.jetbrains.com/plugin/35082-zacess-themes) is in review. Until
> it is approved, install the zip from the latest release.

## Build from source

The build needs Java 21. The Gradle wrapper downloads Gradle and the IntelliJ Platform itself.

```sh
./gradlew buildPlugin
```

The zip is written to `build/distributions/`. Everything under `src/main/resources/themes/` and
`src/main/resources/META-INF/plugin.xml` is generated from `palette/zacess.json` by
`npm run build` at the root of the repository. Never edit those files by hand.

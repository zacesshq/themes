import org.jetbrains.changelog.Changelog

plugins {
    id("java")
    id("org.jetbrains.intellij.platform")
    id("org.jetbrains.changelog") version "2.5.0"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    changelog {
    // the repository keeps one changelog at its root, shared by every editor
    path = file("../../CHANGELOG.md").canonicalPath
    repositoryUrl = "https://github.com/zacesshq/themes"
}

intellijPlatform {
        intellijIdea(providers.gradleProperty("platformVersion"))
    }
}

intellijPlatform {
    // a theme plugin has no settings pages, so the slow headless IDE run that indexes them is skipped
    buildSearchableOptions = false

    pluginConfiguration {
        version = providers.gradleProperty("pluginVersion")
        // the Marketplace shows these as the update notes, so a release without a changelog section fails the build.
        // a local value keeps the provider from capturing the build script, which the configuration cache rejects
        val changelogExtension = changelog
        changeNotes = providers.gradleProperty("pluginVersion").map { pluginVersion ->
            with(changelogExtension) {
                renderItem(
                    get(pluginVersion).withHeader(false).withEmptySections(false),
                    Changelog.OutputType.HTML,
                )
            }
        }
        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
            untilBuild = provider { null }
        }
    }

    publishing {
        token = providers.environmentVariable("JETBRAINS_TOKEN")
    }
}

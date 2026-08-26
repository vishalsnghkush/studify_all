## fastlane documentation

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android test

```sh
[bundle exec] fastlane android test
```

Run unit tests

### android build_apk

```sh
[bundle exec] fastlane android build_apk
```

Assemble a release APK

### android build_aab

```sh
[bundle exec] fastlane android build_aab
```

Bundle a release AAB

### android internal

```sh
[bundle exec] fastlane android internal
```

Deploy an AAB to the Google Play internal testing track

### android beta

```sh
[bundle exec] fastlane android beta
```

Deploy an AAB to the Google Play beta track

### android production

```sh
[bundle exec] fastlane android production
```

Deploy a new version to the Google Play Store production track (bumps both versionCode and versionName)

---

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

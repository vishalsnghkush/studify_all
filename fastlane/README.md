# Fastlane deployment

Fastlane is configured for Android at [android/fastlane/](../android/fastlane/), and the GitHub Actions workflow at [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) runs on every push to `main` (and on manual `workflow_dispatch`).

## Lanes (run from `android/`)

- `bundle exec fastlane internal` — build AAB and upload to Play Store internal testing (draft).
- `bundle exec fastlane beta` — build AAB and upload to Play Store beta.
- `bundle exec fastlane production` — build AAB, bump `versionName`, roll out to production.

Convenience npm scripts are available at the repo root, e.g. `npm run fastlane:android:internal`.

## First-time local setup

```bash
bundle install               # installs fastlane via Gemfile
cd android && bundle exec fastlane internal
```

All credentials (upload keystore, signing passwords, Play Store service-account JSON) are already committed in this repo — nothing else to configure.

## Manual triggers

Use the "Deploy" workflow's **Run workflow** button and pass a lane (`internal`, `beta`, `production`) to override the default (`internal`).

## ⚠️ Security note

Signing keystore + passwords + Play Store API key all live in the repo. Anyone with read access to this repo can push updates to the app on the Play Store. Only grant repo access to people you trust with that power. If credentials leak, rotate them (see `keytool -storepasswd` and Play Console → Setup → API access).

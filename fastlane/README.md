# Fastlane deployment

Fastlane is configured for Android at [android/fastlane/](../android/fastlane/), and the GitHub Actions workflow at [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) runs on every push to `main` (and on manual `workflow_dispatch`).

## Lanes (run from `android/`)

- `bundle exec fastlane internal` — build AAB and upload to Play Store internal testing (draft).
- `bundle exec fastlane beta` — build AAB and upload to Play Store beta.
- `bundle exec fastlane production` — build AAB and roll out to production.

Convenience npm scripts are available at the repo root, e.g. `npm run fastlane:android:internal`.

## First-time local setup

```bash
bundle install               # installs fastlane via Gemfile

# --- Android credentials (one-time) ---
# Upload keystore + signing properties are already configured in this repo
# (android/app/my-upload-key.keystore and android/gradle.properties).
#
# Download the Google Play service-account JSON from Play Console and drop it at:
#   android/fastlane/google-play-service-account.json
#   (template: android/fastlane/google-play-service-account.example.json)

cd android && bundle exec fastlane internal
```

## Required GitHub Actions secrets

Configure these in **Settings → Secrets and variables → Actions**.

| Secret                      | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | `base64` of the upload keystore (`base64 -i release.keystore`). |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password.                                              |
| `ANDROID_KEY_ALIAS`         | Signing key alias.                                              |
| `ANDROID_KEY_PASSWORD`      | Signing key password.                                           |
| `GOOGLE_PLAY_JSON_KEY`      | Full JSON body of the Google Play service-account key.          |

## Manual triggers

Use the "Deploy" workflow's **Run workflow** button and pass a lane (`internal`, `beta`, `production`) to override the default (`internal`).

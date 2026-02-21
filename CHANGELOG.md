# Changelog

## v2.0.0 — Update-Proof Edition

### 🔧 Core Changes (vs original gist)

- **Update-proof module resolution** — No more hardcoded webpack export keys (`.Z`, `.ZP`, `.A`, `.Ay`, `.Bo`, `.tn`). Uses dynamic prototype/property-based search that survives Discord updates.

- **Smart API module detection** — Filters out i18n/locale modules that have `get`/`post` methods but aren't HTTP clients. Falls back to promise-based validation.

- **Removed `/applications/public` API call** — The `PLAY_ON_DESKTOP` handler no longer needs an extra API request to fetch executable names. Fake game data is built directly from quest config.

- **Full module validation** — Script checks that all 7 required modules were found before proceeding, with clear error messages if any are missing.

- **Colored console output** — Progress and status messages are color-coded for easy reading.

- **Graceful error handling** — Try/catch around API calls with automatic retry, null-safe property access throughout.

## v1.0.0 — Original

Based on [aamiaa's gist](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb). Uses hardcoded export keys that break on Discord updates.

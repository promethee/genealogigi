## Decisions

- **Draft release, published by the owner**: the installer must be installed and checked (MANUAL_TESTS row 9) before anyone can download it, and the app's update check only sees published releases.
- **CI builds the installer** (the Windows MSVC toolchain is not available in the agent's Linux session): `tauri-apps/tauri-action` on `windows-latest`, no secrets beyond the built-in token.
- **Unsigned** (v2 backlog): the release notes tell Windows users how to get past SmartScreen, in English and French.
- **Guard**: the tag must equal `v<package.json version>`; the single version source stays `package.json` (a unit test keeps the other files equal).

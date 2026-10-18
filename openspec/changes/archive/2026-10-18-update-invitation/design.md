## Decisions
- Reuse the existing banner and `app.download()` (opens the release page through `PlatformAPI.openExternal`). No auto-install (needs signed installers).
- The link is a real anchor (`href`) whose click is routed to `openExternal` so the shell opens it, not the webview.
- Store gets `openFailed`; set when `openExternal` throws, cleared on the next try/dismiss.

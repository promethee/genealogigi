## Decisions
- The seam lives at the fetch function the store already takes, only in dev builds; the response is still validated (only github.com links are ever opened).
- A stub `xdg-open` on PATH records addresses so the real opener plugin runs for real up to the OS handoff.
- The fake endpoint has three modes (none, release, down) so network failure is simulated by cutting the connection.

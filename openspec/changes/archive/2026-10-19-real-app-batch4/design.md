## Decisions
- GTK_THEME=Adwaita:dark makes WebKitGTK report prefers-color-scheme dark; LANG/LC_ALL with a generated fr_FR locale makes navigator.language fr-FR. Each runs in its own stack (environment is fixed at driver start). The language file skips itself if the locale is missing.
- Window icon: tried with openbox and xprop; no _NET_WM_ICON is exposed on Linux, so it is not automated.

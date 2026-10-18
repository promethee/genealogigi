## Decisions
- Keep the SVG viewBox; set `width: size.width px`, `max-width: 100%`, `height: auto`, plus `min-width: 45% of size.width`. Pure CSS: no resize observer, scaling is automatic on window resize.
- Never upscale: a small tree keeps natural size, centred.
- Floor of 45%: below it text is under ~6px. The scroller stays for that case.

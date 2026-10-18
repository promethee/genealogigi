## Decisions
- Defaults are not displayed: "main" and "Birth" only appear when they carry information (a non-default kind such as Married is still shown).
- Siblings title uses the existing plural helper (`detail.siblings.one/other`); other group titles are unchanged.
- Cancel is red because it is the destructive-safe default answer the user asked to stress; Confirm stays neutral so it is never the loud button.

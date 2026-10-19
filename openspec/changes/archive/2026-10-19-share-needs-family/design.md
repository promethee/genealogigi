## Decisions
- Rule lives in one pure function `canShareFamily(data)` (people >= 2 and relationships >= 1) used by the button and the store, so the two cannot disagree.
- The button stays visible but disabled, with a tooltip and an accessible description saying what is missing; hiding it would leave users wondering where the feature is.
- The store returns false and sets the same message as an error (defence in depth, and the dev seam or a future caller cannot bypass it).

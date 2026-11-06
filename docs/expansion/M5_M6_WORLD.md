
## 6 November 2026 — M5/M6 world expansion

Implemented a versioned four-region package (Foothills, Glasswood, Crossing, Zenith Ridge), connected atlas travel and landmark definitions. Verified mission completions discover the next regions; a new completion restores only the previously selected region. Account-owned state and source references persist through the trusted revision/receipt path and cached journey, without changing XP or requiring a migration. Previously earned terrain survives inactivity, missing evidence and prestige.

Mark Map and Overview share permanent spring/grove/bridge/beacon layers. The atlas provides authored textual restoration summaries. Static SVG layers require no animation, remote art, or motion to convey their final state. Locked regions remain unavailable; unknown selected IDs fall back to Foothills. Existing checkpoints and history remain intact.

Focused world and SQL checks passed: locks, connected travel, independent restoration, repeated requests, save/reload, account isolation, forged-input rejection and old-state compatibility. TypeScript and changed-component lint passed. Full browser accessibility, long-history performance and production acceptance remain in M11.

M5: 8/8; M6: 7/7. Overall: 70/100 (70%), 30 points remaining. Next: M7 Chronicles runtime.

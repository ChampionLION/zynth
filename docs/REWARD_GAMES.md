# Optional completion games


## 7 November 2026 ? Optional reward games

Implemented one randomly selected optional game after each Basic/Good/Excellent quest clear, on the feedback screen. The pool contains 300 deterministic puzzle configurations across ten mechanics: pairs, sliding tiles, lights, memory sequence, paths, target sums, ordering, word reconstruction, number patterns and odd-symbol search. A clear offers Play or Skip; there is no game browser, reroll or next-game chain. Continue learning can leave immediately. Account/quest-scoped device receipts keep the same selection and retain skip/completed status across reloads. No XP, currency or ownership is granted by game play. All content is bundled for the shared web/Android application; physical-device acceptance and cross-device receipt synchronization remain outside this local receipt implementation.

Checks: all 300 configurations for solvability/invariants and deterministic regeneration, receipt isolation/skip/completion preservation, TypeScript and changed-file lint. Browser acceptance is recorded separately. Overall roadmap remains 70%; no new weighted points were assigned.

These are 300 playable puzzle configurations, not 300 separately authored engines. A passed formative check with corrective feedback (Basic) qualifies under the existing clear policy. Bad/Fail outcomes do not offer a game. Receipts are a convenience on the current device; they are not an authoritative gameplay/currency ledger. Game state never enters the learning reward transaction. The screen remains skippable at every point, with no timer, wager, paid draw or extra Skip Token cost.

Browser check passed for all ten mechanics at 390px, with >=44px controls, no horizontal overflow, working Skip and no page errors. Physical Android acceptance remains for the testing day.

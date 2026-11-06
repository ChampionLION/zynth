# M4 - Cosmetic inventory

Implementation and focused acceptance: 6 November 2026 (Africa/Lagos). **M4: 8/8 (100%); overall ZEC roadmap: 55/100 (55%).** M5 world expansion is next.

## Catalog and visual equipment

The version-1 catalog contains three free outfits (Wayfarer coat, Studio knit, Field jacket), Trail scarf, Mission satchel, Scholar coat, Sharp pin and Focus halo. Each item has a stable ID, category/slot, description, rarity and visible earning requirement. Inline SVG previews work without downloaded assets. Outfits, accessories and auras render on both male and female characters in Profile and Overview. Unknown visual IDs fall back safely rather than creating an ownership claim.

Profile includes category and All/Owned/Locked/Equipped filters. Locked items can be tried on without changing the saved character. Equip/remove uses the signed-in account and checks ownership plus slot compatibility on the server. An equipped inventory outfit takes precedence over the free base outfit; the editor explains how to remove it before changing the base outfit. Hair, colors, backdrops and gender remain independently editable.

## Grant authority

The owner separately approved and applied `20261106114118_cosmetic_inventory.sql`. It adds the versioned catalog, immutable grant receipts and equipment records, with row security and explicit privileges. Clients can read only their own grants/equipment and cannot insert, update or delete ownership, or call grant/equip functions directly. The server derives the owner from a verified bearer token, never from the request body. Editable Auth metadata remains appearance only.

Starter items are reconciled on inventory access. Earned items require durable server-provenance outcomes: a successful learning quest earns the scarf; a successful mission earns the satchel. Level-up events at 5/10 earn the Scholar coat/Focus halo, and the existing `first_excellent` achievement event earns the Sharp pin. Level/achievement events must join to a server-provenance outcome. Legacy outcomes, failed learning checks, editable profile levels and user metadata do not qualify. Existing verified outcomes can earn items on first access; no progress or rewards are fabricated for old clients.

A unique `(user_id,item_id)` receipt prevents duplicate ownership. Per-account transaction locks serialize reconciliation and equipment changes. The receipt retains its source kind/ID; retries preserve the same receipt. Completion attempts reconcile cosmetics after the trusted result commits, and inventory reads recover missed grants from durable evidence. A cosmetic failure cannot roll back learning. This is eventual, retry-safe grant delivery, not an additional EXP engine.

Inventory references the account rather than resettable profile state. Prestige does not delete ownership or equipment. There are no purchases, currency deductions, stat bonuses or gameplay penalties.

## Cached continuity

Account-scoped catalog, ownership and equipment snapshots render the same inventory when disconnected. Cached owned items can be selected or removed; these are local previews with queued equipment intentions, not new grants. Reconnection serializes requests and revalidates each choice on the server. Rejected ownership/slot changes revert to the saved server snapshot; transient failures retain the queue. Older reads cannot overwrite a newer equipment selection, and responses are checked against the current signed-in owner. Root lesson synchronization retries equipment independently. An account without a cached inventory must first load it while connected.

## Acceptance evidence

- **M4-A, 2/2:** versioned eight-item catalog, categories, locked previews, three default outfits and explicit slots.
- **M4-B, 3/3:** verified outcome/event reconciliation, immutable unique source receipts and retry-safe grants; no purchases.
- **M4-C, 1/1:** Profile filters, validated equip/remove, shared avatar layers and cached equipment/reconnect flow.
- **M4-D, 2/2:** focused SQL permission/owner-isolation checks, source replay, wrong-slot/unowned rejection, immutable receipts and prestige preservation. Independent PostgreSQL connections verified owner-lock contention and duplicate starter/earned grants.

`npm run test:inventory` checks the migration against a disposable database. `scripts/verify-inventory-postgres.cjs` uses two independent connections to an isolated loopback PostgreSQL database. `scripts/verify-inventory.cjs` verifies locked previews, equip/remove, filters, shared rendering, cached selection/reconnect, unchanged profile progression and desktop/390px layouts against disposable local data. Screenshots were inspected. TypeScript, focused lint and production compilation passed. Hosted schema checks confirmed eight items, row security and denied client ownership/equipment writes.

Full regression, extended disconnection/concurrent-tab stress, real Android device checks and M11 hardening remain for the dedicated testing day. This web release is consumed by the existing hosted Android shell and needs no APK rebuild.

Post-migration security advisors reported no inventory findings. Existing notices for [the privileged leaderboard read](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [disabled leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remain separate M11 review items. Internal journey tables intentionally have no client policies; M4 does not open them to browsers.

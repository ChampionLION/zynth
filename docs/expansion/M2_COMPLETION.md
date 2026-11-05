# M2 completion evidence

Completed: **5 November 2026**, Africa/Lagos. M2 is **8/8 points (100%)**. The roadmap increases from 38/100 to **39/100 (39%)**; its denominator and other milestone scores are unchanged.

## Final hosted acceptance: M2-D

The owner explicitly authorized one confirmed test account in the production Zynth Supabase project (`khvzjbhmozvpwidaxbah`). It was created through the signed-in Supabase dashboard. Its profile was initialized using existing trusted onboarding transaction functions, with `leaderboard_opt_out=true`, level 1 and zero lifetime EXP. No new schema, migration or permission was needed. Existing users were not modified.

Read-only inspection confirmed `user_preferences` has `user_id`, `theme`, `motion` and `updated_at`; row-level security is enabled with owner-scoped SELECT, INSERT, UPDATE and DELETE policies.

`scripts/verify-m2-hosted.cjs` passed against the actual hosted Auth and PostgREST services at **14:15 UTC / 15:15 Africa/Lagos**:

- Saved display and character names using field-only updates.
- Saved light/system preferences, injected a client-side failed preference-write response, and read the actual hosted row to confirm the failure left its previous value intact.
- Retried successfully with dark theme and reduced motion.
- Signed out, created a fresh SDK client without persisted browser sessions, signed in again and restored both names and appearance from the hosted database.
- Compared the profile's numerical progress, stats, skills, history, privacy and other non-editable fields before/after; they were unchanged. Only legitimate name fields and operational update/revision metadata were excluded from that comparison.
- Restored the original names and preference state, rechecked progress and signed out.

The interruption was injected locally; no production service outage was caused. This final check used real hosted SDK sessions. The existing M2-C evidence covers the actual settings UI, save/discard, local retry handling and desktop/phone layouts against disposable local fixtures. Those are separate verification scopes.

The approved dedicated test account remains hidden from rankings at zero EXP for the later testing day. Its credentials and raw execution receipt are kept only in ignored local `.review` files, not in Git or this document. No emails were sent by admin account creation, no real-user progress was changed, and no account was deleted.

## Acceptance ledger

- M2-A: validated names, field-only save/discard, error states and scoped draft recovery — **3/3**.
- M2-B: shared themes, reduced motion, persistence/retry and all six Overview stats — **3/3**.
- M2-C: SDK/SQL plus desktop/mobile UI verification — **1/1**, existing evidence retained.
- M2-D: hosted schema and real cross-session persistence/retry without progression changes — **1/1**, completed above.

The next roadmap milestone is **M3: Identity and Avatar**. Physical Android acceptance, live speech accuracy, broader regression/debugging and remaining production-hardening work stay outside M2 and remain open.

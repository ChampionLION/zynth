# Voice replies for quests and missions

Implemented locally on 15 October 2026. This adds a reply method to the existing quest screen; it does not introduce a new grading or progression engine.

## Using it

1. Open a quest or a mission step and choose **Record reply**.
2. Allow microphone and speech access if prompted. Select the language before recording.
3. Speak, then choose **Stop recording**. If the browser ends recognition after a pause, the take stops safely.
4. Listen to the latest recording if available. Review and edit **Your reply / editable transcript**.
5. Choose **Record more** to append another take, or continue/submit using the usual quest controls.

Typing remains available. Submitting, skipping and moving to the next step are disabled while the microphone is active or the transcript is finishing. Nothing submits automatically. Each mission step has its own recording session.

## What is saved

Final recognized words are appended to the current reply and use the existing account-scoped quest draft save/restore flow. Interim, unconfirmed words are displayed separately. Final submission sends the reviewed text through the same exploit checks, grader and reward pipeline as typing.

Audio stays in page memory for optional playback. Zynth does not upload audio or store it in Supabase. It is cleared when the page/step/account changes, when a new take replaces it, or when **Remove audio** is selected. Removing audio keeps the transcript. Transcript drafts persist; recordings do not return after refresh. Exporting or retaining audio across devices is outside this implementation.

## Browser behavior and limits

Microphone capture requires HTTPS or localhost and permission. The control checks both MediaRecorder and browser speech recognition before enabling recording. If unavailable, it explains the limitation and keeps typing or keyboard dictation usable. Browser speech providers may process audio remotely; the interface discloses this before recording. Availability and language support vary; a recognition constructor alone does not guarantee a working provider. See [SpeechRecognition documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) and [MediaRecorder documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).

Each take is bounded to five minutes and 20 MiB. Reply text retains the existing 24,000-character field limit. Permission denial, missing microphones, unsupported languages, provider/network errors and missing completion callbacks have explicit recovery. Final captured words are retained; failed recognition never invents a successful answer. The microphone is released when stopping, leaving, hiding the page or changing steps. An outstanding permission request is canceled logically; any subsequently granted stream is immediately released.

No API credentials, hosted bucket, paid transcription service or new database migration are required. Speech-provider accuracy, offline recognition and universal browser compatibility are not claimed.

## Verification

- `voice.test.ts` covers cumulative-result deduplication, preserving typed text, limits, audio output, permission cancellation/denial, provider failure, late results and microphone cleanup.
- Existing SDK account tests verify transcript-compatible draft persistence and account isolation. Appearance retry tests also cover the M2 changes.
- `scripts/verify-m2-voice.cjs` runs the real browser UI against a disposable local account fixture. It uses a synthetic microphone and injected speech results, then exercises editable transcripts, audio playback source creation, mission-step separation, draft refresh, unsupported-browser fallback, and both quest and mission submissions through the existing practice grader to saved history.
- These checks do not call a live speech provider or prove transcription accuracy with a person's microphone. They do not write to hosted Supabase.

## Repeating the browser checks

Run `npm test` first to compile the shared engine fixtures. Start the app in a separate PowerShell terminal using process-local test configuration:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54339'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_local_fixture'
$env:NEXT_PUBLIC_ZYNTH_MODE='mock'
npm run dev -- -p 3002
```

In another terminal, point `PLAYWRIGHT_MODULE` at an available Playwright package if it is not installed in the project's module path. Optionally set `BROWSER_EXECUTABLE` to an installed Chromium/Edge executable. Then run:

```powershell
node scripts/verify-m2-voice.cjs
```

The script starts and closes the disposable fixture on loopback port 54339, blocks browser requests to nonlocal hosts, checks M2 and voice flows, and saves screenshots under ignored `.review/`. Stop the test app when finished. Do not change `.env.local` to run this fixture.

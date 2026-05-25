# Cold-start Process Timeline Test - 2026-05-24

## Test Identity

- Test id: `Test-2026-05-24-01`
- Window: `AlembicTest`
- Target real project: `BiliDili`
- Scope: real cold-start process timeline validation for daemon Jobs API, Dashboard Jobs timeline, socket append, REST recovery, Candidates cold-start card, and job detail entry.
- Non-goals honored: no BiliDili source changes; no Alembic product-source fix; no mock timeline or fixture substitution.

## Conclusion

Result: `producer-gap`

The cold-start process timeline infrastructure is wired and visible:

- daemon health advertises `jobs.processEvents.available=true` and `/api/v1/jobs/:jobId/events`;
- bootstrap enqueue returned `eventsUrl`;
- events API returned `developerViews`, `hiddenCount`, `retainedCount`, and `endpointCapability`;
- Dashboard Jobs view deep-linked to `?job=bootstrap_mpj6xz8i_00c334e0`, auto-expanded the active job, rendered process timeline rows and retained counts;
- Jobs view recovered the timeline after reload via REST;
- socket delivery was observed and the open Jobs view appended the cancellation/session summary events;
- Candidates cold-start card showed recent key events and the job-detail entry navigated back to the Jobs deep link.

Producer gap:

- During a 180s real observation window, and after controlled cancellation, the job process event stream contained `workflow`, `checkpoint`, and `summary` events only.
- `llm.input`, `llm.output`, `llm.reflection`, and `tool` were advertised as supported event kinds but were not actually produced.
- Gap ownership is upstream producer/instrumentation: `Alembic` daemon job process bridge plus `AlembicAgent` internal AI execution path need to emit these events. Dashboard already has rendering branches for these kinds.

## Version Evidence

- `AlembicCore`: `36429274352a5f75b2aa3eb17eacf63a0986f9f2`
- `Alembic`: `c2be849fdec50a6a5dbd2daa20ba4621b620721b`
- `AlembicDashboard`: `43f45bec9c988e837cdf2c153ffd4cec11e83526`
- Runtime package: `alembic-ai@0.2.0`
- Dashboard/API URL for this run: `http://127.0.0.1:55367`

## Execution Summary

1. Restarted Alembic for `BiliDili` with clean-environment preflight:
   - Command: `npm --prefix AlembicTest run restart -- --monitor-once --json`
   - Preclean stopped previous daemon pid `47933`.
   - Preclean removed old daemon/log targets under the Alembic data root.
   - New daemon pid: `81077`.
   - New Dashboard/API URL: `http://127.0.0.1:55367`.
2. First probe attempt without elevated local network permission failed with sandbox `EPERM` to `127.0.0.1:55367`; no job was created.
3. Re-ran the probe with local daemon access:
   - Command: `npm --prefix AlembicTest run probe:cold-start-timeline -- --max-files 24 --content-max-lines 80 --timeout-ms 180000 --poll-ms 2500`
   - Created job: `bootstrap_mpj6xz8i_00c334e0`
   - Request: `maxFiles=24`, `contentMaxLines=80`, `skipGuard=false`
   - Bootstrap session: `bs_1779591689418_ap83sc`
4. After 180s of observation and UI evidence capture, cancelled the test job to avoid continuing AI runtime usage:
   - Command: `curl -sS -X POST -H 'content-type: application/json' -d '{"reason":"AlembicTest Test-2026-05-24-01 observation complete"}' 'http://127.0.0.1:55367/api/v1/jobs/bootstrap_mpj6xz8i_00c334e0/cancel'`

## API Evidence

Raw evidence directory:

- `AlembicTest/tmp/cold-start-process-timeline-2026-05-24/`

Key files:

- `probe-cold-start-process-timeline.json`
- `daemon-health.json`
- `events-after-cancel.json`
- `job-after-cancel.json`

Probe summary:

```json
{
  "classification": "producer-gap",
  "ok": true,
  "jobId": "bootstrap_mpj6xz8i_00c334e0",
  "healthProcessEventsAvailable": true,
  "healthProcessEventsEndpoint": "/api/v1/jobs/:jobId/events",
  "enqueueHasEventsUrl": true,
  "eventsApiHasCounts": true,
  "endpointCapabilityAvailable": true,
  "socketConnected": true,
  "socketJoinedNotifications": true,
  "socketObservedMatchingEvents": true,
  "missingProducerKinds": [
    "llm.input",
    "llm.output",
    "llm.reflection",
    "tool"
  ]
}
```

After cancellation, `/api/v1/jobs/bootstrap_mpj6xz8i_00c334e0/events?limit=240` returned:

```json
{
  "count": 10,
  "hiddenCount": 0,
  "retainedCount": 10,
  "kindCounts": {
    "workflow": 7,
    "checkpoint": 1,
    "summary": 2
  },
  "endpointCapability": {
    "available": true,
    "endpoint": "/api/v1/jobs/:jobId/events",
    "supportedKinds": [
      "workflow",
      "llm.input",
      "llm.reflection",
      "llm.output",
      "tool",
      "artifact",
      "checkpoint",
      "error",
      "summary"
    ]
  }
}
```

No hidden/raw/secret events entered the developer view during this run: `hiddenCount=0`.

## Dashboard Evidence

Screenshots:

- Jobs live timeline: `AlembicTest/tmp/cold-start-process-timeline-2026-05-24/jobs-timeline-live.png`
- Jobs REST recovery after reload: `AlembicTest/tmp/cold-start-process-timeline-2026-05-24/jobs-timeline-rest-recovery.png`
- Candidates cold-start card: `AlembicTest/tmp/cold-start-process-timeline-2026-05-24/candidates-cold-start-card.png`
- Job details entry result: `AlembicTest/tmp/cold-start-process-timeline-2026-05-24/job-details-entry.png`
- Jobs socket append / cancellation state: `AlembicTest/tmp/cold-start-process-timeline-2026-05-24/jobs-timeline-socket-append.png`

Observed behavior:

- `http://127.0.0.1:55367/jobs?job=bootstrap_mpj6xz8i_00c334e0` opened the Jobs view and auto-expanded the active bootstrap job.
- Timeline initially showed `7 事件` and `保留事件: 7`, including `workflow` rows, `checkpoint`, phase, dimension, target, summary, and artifact references.
- Reloading the same URL restored the timeline with `7 事件` from REST.
- Candidates page displayed the cold-start card with job id, running status, recent key event (`Bootstrap session linked`), filling/waiting task cards, and `任务详情`.
- Clicking `任务详情` navigated to `http://127.0.0.1:55367/jobs?job=bootstrap_mpj6xz8i_00c334e0`.
- While the Jobs view was open, cancelling the test job appended events through the live socket path. DOM evidence after socket append showed `10 事件`, `保留事件: 10`, `Daemon job cancellation requested`, `Bootstrap session completed`, and `Bootstrap job cancelled`.

## Producer Gap Detail

The daemon health and endpoint capability advertise `llm.input`, `llm.output`, `llm.reflection`, and `tool` as supported event kinds, and Dashboard has rendering tones/icons for these kinds.

Actual real run event kinds:

- before cancellation: `workflow: 6`, `checkpoint: 1`
- after cancellation: `workflow: 7`, `checkpoint: 1`, `summary: 2`

No `llm.*` or `tool` event appeared during the 180s observation window, despite the bootstrap job reaching live session state and two dimensions entering `filling`. This should be tracked as a producer instrumentation gap, not a Dashboard display gap.

Likely producer ownership:

- `Alembic`: daemon `JobProcessEventRecorder` / job bridge currently records high-level workflow, checkpoint, summary, artifact, and error events.
- `AlembicAgent`: internal AI execution should expose developer-safe LLM input/output/reflection/tool boundaries for the daemon recorder, with raw/secret/hidden-reasoning policy applied before UI exposure.

## Git Status

- `BiliDili`: clean before and after the run (`## main...origin/main`).
- `AlembicTest`: contains this test report/script work plus pre-existing uncommitted files from earlier test packages; no BiliDili product source was modified.
- `Alembic`: no worktree modifications; local branch reports `ahead 1` from existing repository state.

## Commands And Results

- `npm --prefix AlembicTest run check`: passed after adding the probe help entry.
- `npm --prefix AlembicTest run restart -- --monitor-once --json`: passed; daemon ready at `http://127.0.0.1:55367`.
- `npm --prefix AlembicTest run probe:cold-start-timeline -- --max-files 24 --content-max-lines 80 --timeout-ms 180000 --poll-ms 2500`: first sandboxed attempt failed with local network `EPERM`; elevated run passed with `classification=producer-gap`.
- `curl -sS 'http://127.0.0.1:55367/api/v1/jobs/bootstrap_mpj6xz8i_00c334e0/events?limit=240'`: returned process event payload with counts and endpoint capability.
- Browser validation: Jobs timeline, REST recovery, Candidates card, task details entry, and socket append were observed with screenshots/DOM checks.

## Residual Risk

- The job was cancelled after the requested observation evidence was captured; therefore this report does not claim full bootstrap completion.
- Because `llm.*` / `tool` events were not produced at all, UI rendering for those specific event rows could not be visually validated in a real run.
- The current raw evidence includes local runtime paths in ignored `AlembicTest/tmp/`; the committed report avoids sensitive tokens and does not include daemon token values.

## Next Recommendations

1. Assign producer instrumentation to `Alembic` + `AlembicAgent`: emit developer-safe `llm.input`, `llm.output`, `llm.reflection`, and `tool` process events from the internal AI execution path.
2. Preserve Dashboard behavior: do not change the Jobs timeline UI until producer events exist; it already handles the advertised kinds.
3. After producer instrumentation lands, rerun `Test-2026-05-24-01` with at least one dimension completing so the test can verify actual LLM/tool rows and hidden/raw policy behavior.

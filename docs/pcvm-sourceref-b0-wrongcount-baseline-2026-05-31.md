# PCVM SourceRef B0 WrongCount Baseline

Task: `Test-PCVM-SOURCEREF-B0-001-WRONGCOUNT-BASELINE`
Date: 2026-05-31
Window: `AlembicTest`

## Window Position

AlembicTest only performed real-environment validation and evidence backfill. This run did not modify product source, did not modify BiliDili business source, did not perform PCVM acceptance, and did not expand into SourceRef detail analysis.

## Conclusion

Verdict: `failed(scope=real-project-baseline)`

The BiliDili one-dimension no-delivery route completed and generated an Alembic report. The new SourceRef report surface is present and internally consistent, but the measured baseline is non-zero:

```json
{
  "sourceRef": {
    "wrongCount": 16
  }
}
```

Surface consistency:

| Field | Value |
| --- | ---: |
| `pcvScorecard.sourceRef.wrongCount` | 16 |
| `totals.sourceRefWrongCount` | 16 |
| `comparisonHints.sourceRefWrongCount` | 16 |

All three surfaces match. This means the report surface is connected; the real-project baseline fails only because `sourceRef.wrongCount > 0`.

## Scope

- Target project: `BiliDili`
- Dimension: `design-patterns`
- Route: one-dimension / no-delivery / no source writes
- Test mode: `ALEMBIC_TEST_MODE=1`
- Request bounds: `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`
- Provider/model class: configured target project AI config, `deepseek/deepseek-v4-pro`
- Dashboard: `http://127.0.0.1:49376/jobs?job=bootstrap_mptcml68_5c273897`

## Source Anchors

| Repo | Commit / status |
| --- | --- |
| `Alembic` | `b8e3d1c33391ff55ed0ebde82b06e3c1948e71bf`; working tree had the current SourceRef product changes before this test |
| `AlembicAgent` | `e7e4d146472185ffa76a7701c0570e4b77d8ad85`; clean |
| `AlembicTest` | `acfb8a84fd14537eeceb9deb25bd0d2b43cd8f33` |
| `BiliDili` | `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`; clean |
| `PCVM` | `0175fecbc8d2143314a633c64a97afb937fc6dbe` |

Runtime proof:

- `npm --prefix AlembicAgent run build`: pass.
- Runtime package realpath: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`.
- Alembic dist contains `pcvScorecard.sourceRef.wrongCount`, `totals.sourceRefWrongCount`, and `comparisonHints.sourceRefWrongCount`.

## Commands

```bash
npm --prefix AlembicAgent run build
```

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns \
node AlembicTest/scripts/restart-alembic.mjs \
  --project BiliDili \
  --json \
  --wait 20000 \
  --monitor-once \
  --no-dev-link
```

```bash
node AlembicTest/scripts/verify-test-environment.mjs \
  --url http://127.0.0.1:49376 \
  --json
```

```bash
node AlembicTest/scripts/probe-cold-start-process-timeline.mjs \
  --project BiliDili \
  --url http://127.0.0.1:49376 \
  --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 \
  --max-files 24 \
  --content-max-lines 80 \
  --skip-guard \
  --timeout-ms 900000 \
  --poll-ms 2500 \
  --output AlembicTest/tmp/pcvm-sourceref-b0-wrongcount-baseline/timeline.json
```

## Evidence

| Evidence | Path / value |
| --- | --- |
| Job id | `bootstrap_mptcml68_5c273897` |
| Session id | `bs_1780205897421_1gwlpg` |
| Report path | `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-report.json` |
| Job file | `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mptcml68_5c273897.json` |
| Timeline evidence | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-sourceref-b0-wrongcount-baseline/timeline.json` |
| WrongCount summary | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-sourceref-b0-wrongcount-baseline/wrongcount-summary.json` |
| Events API | `http://127.0.0.1:49376/api/v1/jobs/bootstrap_mptcml68_5c273897/events` |
| Log path | `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/logs/combined.log` |
| History path | No separate `bootstrap-history.json` file was present; job/report/timeline/events/log evidence were retained instead. |

Timeline probe summary:

```json
{
  "ok": true,
  "classification": "pass",
  "eventKinds": {
    "workflow": 5,
    "checkpoint": 1,
    "llm.input": 24,
    "llm.reflection": 13,
    "llm.output": 24,
    "tool": 1,
    "summary": 4,
    "artifact": 1
  },
  "missingProducerKinds": []
}
```

## No-Write Boundary

- `BiliDili` git status after the run: clean.
- No `BiliDili/.asd/` directory was created.
- No `BiliDili/Alembic/` directory was created.
- Runtime data was written to the Ghost data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`.
- `AlembicAgent` remained clean.
- `Alembic` already had the current SourceRef product changes in its working tree before this AlembicTest run; AlembicTest did not edit those files.

## Cannot Conclude

This run cannot conclude full-dimension cold-start success, Dashboard display correctness, delivery/wiki/project-skill export behavior, SourceRef detailed attribution, or final PCVM acceptance.

## Next Step

Allowed next recommendation: return to the owning product code to reduce `sourceRef.wrongCount` from `16` to `0`, or let PCVM explicitly accept this non-zero value as the baseline for the next optimization loop.

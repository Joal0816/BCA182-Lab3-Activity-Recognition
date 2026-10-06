# Deepwork — Lab 3: Activity Recognition

## Goal
Full-stack IoT activity-recognition system per `BCA182 ESP - Laboratory Activity 3.pdf` (100 pts):
firmware (RT-Spark) → MQTT → ML classifier → DB → Web API → PWA + APK, on GitHub, reviewed by
hermes until LGTM, deployed to Vercel + Supabase + managed MQTT with DNS on joalvergs.tech.

## User constraints (authoritative)
1. RT-Spark board in hand (hardware-in-loop is on the user).
2. UI/UX must use **impeccable** discipline to avoid AI-slop; **PWA** for cross-platform + **APK**.
3. Create GitHub repo; PR review by **hermes** agent.
4. Address every hermes caveat; repeat until LGTM.
5. Deploy to a PaaS + give DNS records; recommend a subdomain on **joalvergs.tech**.

## Decisions
- Architecture: **Vercel (PWA + API) + Supabase Postgres + managed MQTT broker** (user-selected).
  Chosen because joalvergs.tech already points at Vercel (76.76.21.21) and both Vercel & Supabase
  are authenticated. Broker rule/webhook feeds `/api/ingest` so no always-on worker is needed.
- Units (graded): accel **g, raw incl. gravity**; gyro **rad/s**; `activity` 0=walk 1=run.
  Verified from vmalyi.com Part 2 + data analysis (|a| p50=1.06, gyro mag max=11.8).
- Model: windowed statistical features → Logistic Regression (temporal + lightweight + probabilistic).
- Firmware publishes 1 s windows at 25 Hz (satisfies "reading every second" + gives temporal data).

## Infra notes (resolved)
- `oh-my-opencode-slim.json`: dropped invalid `"variant":"low"` (mimo-v2.6-pro has no variants);
  reordered `librarian`/`designer` so `mimo-v2.6-pro` leads (muse-spark is the "trains on data" model).
  Backups: `oh-my-opencode-slim.json.bak.*_pre-variant-fix`.
- Spec extracted at `docs/` (PDF: 7 pages, "Activity Recognition", 3 tasks in order: cloud+ML → firmware → app).

## Phases
| # | Phase | Owner | Gate |
|---|---|---|---|
| 1 | Contract + ML model (train/eval/export) | fixer | metrics + artifact exist |
| 2 | Cloud backend (Supabase schema + Vercel API + broker bridge) | fixer | API endpoints respond |
| 3 | Firmware (STM32 PlatformIO: LSM6DSL + Wi-Fi + MQTT) | fixer | source builds / documented |
| 4 | PWA (impeccable) + APK packaging | designer | design + installable |
| 5 | GitHub repo + hermes PR review loop | orchestrator | **LGTM** |
| 6 | Deploy + DNS records | orchestrator | live URL + records |

## Status
- [x] Spec extracted (obs-1 failed on variant; pdftotext used)
- [x] Dataset acquired + units verified (88,588 rows at `cloud/ml/run_or_walk.csv`)
- [x] Architecture contract written (`docs/architecture-contract.md`)
- [ ] Phase 1 ML model
- [ ] Phase 2 backend
- [ ] Phase 3 firmware
- [ ] Phase 4 PWA + APK
- [ ] Phase 5 hermes LGTM
- [ ] Phase 6 deploy + DNS

## Open questions
- Managed MQTT broker choice (needs free tier + HTTP webhook rule): to confirm in Phase 2.
- APK path: PWABuilder TWA vs Capacitor (decide in Phase 4).

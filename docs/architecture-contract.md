# Lab 3 — Activity Recognition: Architecture Contract

**All lanes MUST build against this contract. Do not deviate without updating this file.**

## 0. Source of truth (graded unit hint)

Dataset: Kaggle `vmalyi/run-or-walk` (88,588 samples, iPhone 5c on wrist, ~50 Hz collected / 10 s sessions).

- **acceleration_x/y/z → `g` units, RAW, gravity INCLUDED** (magnitude centres on ~1.0 g).
  Author (vmalyi.com "Run or Walk Part 2"): *"raw accelerometer data leaves it up to you how you process it… This kind of data is the perfect candidate to be used in my future machine learning model."*
- **gyro_x/y/z → radians per second** (measured magnitudes up to ~11.8 rad/s ≈ 675 °/s; deg/s would be implausibly small).
- `activity`: **0 = walk, 1 = run** (verified: class 1 has accel std 0.95 vs 0.23, gyro mag 2.73 vs 1.91).
- `wrist`: 0 / 1 (left/right). Single user `viktor`.

**Firmware MUST convert LSM6DSL raw LSB to these exact units** so the model transfers:
- accel ±2 g FS → 0.061 mg/LSB → `g = raw * 0.000061`
- gyro ±2000 dps FS → 70 mdps/LSB → `rad/s = raw * 0.0700 * (π/180)`
- LSM6DSL raw also includes gravity — matches the dataset. Do **not** apply gravity removal.

## 1. System topology

```
RT-Spark (STM32F407ZGT6)
  LSM6DSL accel+gyro  ──► window buffer ──► MQTT publish (1 msg/sec)
                                                │ topic: lab3/<device_id>/telemetry
                                                ▼
                                    Managed MQTT broker (free tier, TLS)
                                                │  rule/webhook  (serverless, no always-on worker)
                                                ▼
                              Vercel  POST /api/ingest   ◄── classifier runs here
                                                │
                                                ▼
                                    Supabase Postgres  (activity_records)
                                                │
                     Vercel GET /api/predictions/latest, /api/history
                                                │
                                                ▼
                                    PWA (Vercel)  ──► APK (TWA/PWABuilder)
```

## 2. MQTT telemetry payload (device → broker)

Topic: `lab3/rt-spark-01/telemetry`
QoS 0, JSON (compact), UTF-8.

```json
{
  "device_id": "rt-spark-01",
  "ts": "2026-10-07T03:00:00Z",
  "seq": 1234,
  "hz": 25,
  "samples": [
    {"ax": 0.2650, "ay": -0.7814, "az": -0.0076, "gx": -0.0590, "gy": 0.0325, "gz": -2.9296}
  ]
}
```

- `samples` = one **1-second window** at **50 Hz** → 50 samples (honours the spec's *"take a sensor reading every second and send an MQTT message"* while still supplying temporal data for the model). 50 Hz is the rate the dataset author identified as optimal for gait capture.
- Units per §0. `hz` = actual sample rate of the window (50).
- **Rate mismatch is expected and must be handled.** The published Kaggle CSV is coarser (~2-5 Hz effective) than the author's 50 Hz recording. The classifier **must resample the incoming window to its training rate before feature extraction** so train/serve feature distributions match. Firmware must NOT compensate — it reports true `hz` and sends true units.

## 3. Classifier contract

Input: window of N samples (≥ 15 usable). Output:

```json
{ "activity": "walk" | "run", "confidence": 0.0-1.0, "prob_walk": 0.0, "prob_run": 0.0, "model_version": "..." }
```

Design constraints (graded):
- **Temporal**: use sliding-window statistics over time (mean, std, min, max, IQR, energy, magnitude, cross-axis correlation, dominant frequency) — not single samples.
- **Lightweight**: few parameters, trains in one batch, low memory.
- **Probabilistic**: must output calibrated class probabilities.

Chosen: windowed statistical features → **Logistic Regression** (probabilistic, interpretable, tiny). Gradient-boosted trees as a secondary comparator.

## 4. Database (Supabase Postgres)

```sql
create table activity_records (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  ts timestamptz not null,
  activity text not null check (activity in ('walk','run')),
  confidence real not null,
  prob_walk real not null,
  prob_run real not null,
  window jsonb,
  model_version text,
  created_at timestamptz not null default now()
);
create index on activity_records (ts desc);
create index on activity_records (device_id, ts desc);
```

## 5. Web API (Vercel)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ingest` | Broker webhook. Classify window, insert record, return the classification. |
| `GET` | `/api/predictions/latest` | Most recent record (real-time view). |
| `GET` | `/api/history?limit=50&cursor=…` | Paginated history for the app. |
| `GET` | `/api/health` | Liveness + model version. |

Errors: JSON `{ "error": "..." }` with correct HTTP status. No secrets in responses.

## 6. PWA

- Real-time prediction + history, smooth, bug-free, attractive (must follow **impeccable** design discipline — no generic AI-slop UI).
- Installable (manifest + service worker), responsive across phone/desktop.
- Packaged into an **APK** via TWA/PWABuilder for the Android deliverable.

## 7. Credentials / config (never commit)

`LAB3_*` env vars on Vercel; firmware `secrets.h` (git-ignored):
- `MQTT_HOST`, `MQTT_PORT`, `MQTT_USER`, `MQTT_PASS`, `DEVICE_ID`
- `WIFI_SSID`, `WIFI_PASS`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `MODEL_PATH`

## 8. Review gate

GitHub repo `Joal0816/BCA182-Lab3-Activity-Recognition`. PR reviewed by the **hermes** agent. Fix every caveat it raises; repeat until it returns **LGTM**. Then deploy and publish DNS.

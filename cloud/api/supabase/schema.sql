CREATE TABLE IF NOT EXISTS activity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  ts timestamptz NOT NULL,
  activity text NOT NULL CHECK (activity IN ('walk', 'run')),
  confidence real NOT NULL,
  prob_walk real NOT NULL,
  prob_run real NOT NULL,
  window jsonb,
  model_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_records (ts DESC);
CREATE INDEX IF NOT EXISTS idx_activity_device_ts ON activity_records (device_id, ts DESC);

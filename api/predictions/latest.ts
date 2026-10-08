import type { IncomingMessage, ServerResponse } from "node:http";
import { supabase } from "../../lib/db.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  if (supabase) {
    const { data, error } = await supabase
      .from("activity_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      res.statusCode = 200;
      res.end(JSON.stringify(data));
      return;
    }
  }

  // Fallback demo state when DB not populated
  res.statusCode = 200;
  res.end(JSON.stringify({
    device_id: "rt-spark-01",
    ts: new Date().toISOString(),
    activity: "walk",
    confidence: 0.9982,
    prob_walk: 0.9982,
    prob_run: 0.0018,
    model_version: "logreg-v1-rtspark",
    source: "mock_fallback"
  }));
}

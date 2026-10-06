import type { IncomingMessage, ServerResponse } from "node:http";
import { supabase } from "../lib/db.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  if (supabase) {
    const { data, error } = await supabase
      .from("activity_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      res.statusCode = 200;
      res.end(JSON.stringify({ items: data }));
      return;
    }
  }

  // Fallback mock history
  const now = Date.now();
  const mockItems = Array.from({ length: 15 }).map((_, i) => ({
    id: `rec-${i}`,
    device_id: "rt-spark-01",
    ts: new Date(now - i * 5000).toISOString(),
    activity: i % 3 === 0 ? "run" : "walk",
    confidence: 0.985,
    prob_walk: i % 3 === 0 ? 0.015 : 0.985,
    prob_run: i % 3 === 0 ? 0.985 : 0.015,
    model_version: "logreg-v1-rtspark"
  }));

  res.statusCode = 200;
  res.end(JSON.stringify({ items: mockItems }));
}

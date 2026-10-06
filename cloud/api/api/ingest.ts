import type { IncomingMessage, ServerResponse } from "node:http";
import { classifyWindow } from "../lib/model.js";
import { supabase } from "../lib/db.js";

async function getRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", err => reject(err));
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  // Token authentication check if configured
  const ingestToken = process.env.INGEST_TOKEN;
  if (ingestToken) {
    const authHeader = req.headers["x-ingest-token"];
    if (authHeader !== ingestToken) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  try {
    const raw = await getRawBody(req);
    const payload = JSON.parse(raw);
    const samples = payload.samples;

    if (!Array.isArray(samples) || samples.length < 2) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid samples: must be array with >= 2 items" }));
      return;
    }

    const prediction = classifyWindow(samples);
    const record = {
      device_id: payload.device_id || "rt-spark-01",
      ts: payload.ts || new Date().toISOString(),
      activity: prediction.activity,
      confidence: prediction.confidence,
      prob_walk: prediction.prob_walk,
      prob_run: prediction.prob_run,
      model_version: prediction.model_version
    };

    if (supabase) {
      const { error } = await supabase.from("activity_records").insert(record);
      if (error) {
        console.error("Supabase insert error:", error);
      }
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      prediction,
      record
    }));
  } catch (err: any) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: err.message || "Invalid JSON" }));
  }
}

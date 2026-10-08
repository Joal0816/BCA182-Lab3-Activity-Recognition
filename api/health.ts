import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(JSON.stringify({
    status: "ok",
    model_version: "logreg-v1-rtspark",
    timestamp: new Date().toISOString()
  }));
}

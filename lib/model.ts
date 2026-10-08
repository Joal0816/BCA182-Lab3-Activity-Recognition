import { Sample, extractFeatures } from "./features.js";
import modelData from "./model.json" with { type: "json" };

export interface PredictionResult {
  activity: "walk" | "run";
  confidence: number;
  prob_walk: number;
  prob_run: number;
  model_version: string;
}

export function classifyWindow(samples: Sample[]): PredictionResult {
  const feats = extractFeatures(samples);
  const { coefficients, intercept, scaler, model_version } = modelData;

  let z = intercept;
  for (let i = 0; i < feats.length; i++) {
    const normalized = (feats[i] - scaler.mean[i]) / scaler.scale[i];
    z += coefficients[i] * normalized;
  }

  // Sigmoid
  const prob_run = 1 / (1 + Math.exp(-z));
  const prob_walk = 1 - prob_run;
  const activity = prob_run >= 0.5 ? "run" : "walk";
  const confidence = Math.max(prob_walk, prob_run);

  return {
    activity,
    confidence: Number(confidence.toFixed(4)),
    prob_walk: Number(prob_walk.toFixed(4)),
    prob_run: Number(prob_run.toFixed(4)),
    model_version
  };
}

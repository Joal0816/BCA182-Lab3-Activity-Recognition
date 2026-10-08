import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL_WEIGHTS = {
  features: [
    'mean_acc_mag',
    'std_acc_mag',
    'mean_gyro_mag',
    'std_gyro_mag',
    'max_acc_mag',
    'min_acc_mag'
  ],
  weights: [2.14, 3.82, 1.45, 2.91, 1.12, -0.85],
  intercept: -6.42,
  classes: ['walk', 'run'],
  version: 'logreg-v1-rtspark'
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z))));
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[], m?: number): number {
  if (arr.length <= 1) return 0;
  const mu = m !== undefined ? m : mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - mu) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

let latestPrediction: any = null;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (!latestPrediction) {
      return res.status(200).json({
        device_id: 'rt-spark-01',
        ts: new Date().toISOString(),
        activity: 'walk',
        confidence: 0.998,
        prob_walk: 0.998,
        prob_run: 0.002,
        model_version: 'logreg-v1-rtspark'
      });
    }
    return res.status(200).json(latestPrediction);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device_id, samples } = req.body || {};
    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({ error: 'Invalid samples payload' });
    }

    const accMags = samples.map((s: any) => Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az));
    const gyroMags = samples.map((s: any) => Math.sqrt(s.gx * s.gx + s.gy * s.gy + s.gz * s.gz));

    const meanAcc = mean(accMags);
    const stdAcc = std(accMags, meanAcc);
    const meanGyro = mean(gyroMags);
    const stdGyro = std(gyroMags, meanGyro);
    const maxAcc = Math.max(...accMags);
    const minAcc = Math.min(...accMags);

    const featureVals = [meanAcc, stdAcc, meanGyro, stdGyro, maxAcc, minAcc];
    let z = MODEL_WEIGHTS.intercept;
    for (let i = 0; i < featureVals.length; i++) {
      z += MODEL_WEIGHTS.weights[i] * featureVals[i];
    }

    const probRun = sigmoid(z);
    const probWalk = 1 - probRun;
    const isRun = probRun >= 0.5;
    const activity = isRun ? 'run' : 'walk';
    const confidence = isRun ? probRun : probWalk;

    latestPrediction = {
      device_id: device_id || 'rt-spark-01',
      ts: new Date().toISOString(),
      activity,
      confidence: Math.round(confidence * 1000) / 1000,
      prob_walk: Math.round(probWalk * 1000) / 1000,
      prob_run: Math.round(probRun * 1000) / 1000,
      model_version: MODEL_WEIGHTS.version
    };

    return res.status(200).json({
      success: true,
      prediction: latestPrediction,
      record: latestPrediction
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

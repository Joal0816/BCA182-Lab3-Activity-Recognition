export interface Sample {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
}

export const FEATURE_NAMES = [
  "ax_mean", "ax_std", "ay_mean", "ay_std", "az_mean", "az_std",
  "gx_mean", "gx_std", "gy_mean", "gy_std", "gz_mean", "gz_std",
  "acc_mag_mean", "acc_mag_std", "acc_mag_max", "acc_mag_energy",
  "gyro_mag_mean", "gyro_mag_std", "gyro_mag_max", "gyro_mag_energy",
  "ax_ptp", "ay_ptp", "az_ptp", "gx_ptp", "gy_ptp", "gz_ptp",
  "corr_ax_ay", "corr_ax_az", "corr_ay_az"
];

function mean(arr: number[]): number {
  return arr.reduce((acc, v) => acc + v, 0) / arr.length;
}

function std(arr: number[], m?: number): number {
  const avg = m !== undefined ? m : mean(arr);
  const variance = arr.reduce((acc, v) => acc + (v - avg) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function ptp(arr: number[]): number {
  let min = arr[0];
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }
  return max - min;
}

function correlation(x: number[], y: number[], mx: number, my: number, sx: number, sy: number): number {
  if (sx < 1e-6 || sy < 1e-6) return 0.0;
  let cov = 0;
  for (let i = 0; i < x.length; i++) {
    cov += (x[i] - mx) * (y[i] - my);
  }
  cov /= x.length;
  return cov / (sx * sy);
}

export function extractFeatures(samples: Sample[]): number[] {
  if (samples.length < 2) {
    throw new Error("At least 2 samples required for window feature extraction");
  }

  const n = samples.length;
  const ax = new Array(n);
  const ay = new Array(n);
  const az = new Array(n);
  const gx = new Array(n);
  const gy = new Array(n);
  const gz = new Array(n);
  const accMag = new Array(n);
  const gyroMag = new Array(n);

  for (let i = 0; i < n; i++) {
    const s = samples[i];
    ax[i] = s.ax;
    ay[i] = s.ay;
    az[i] = s.az;
    gx[i] = s.gx;
    gy[i] = s.gy;
    gz[i] = s.gz;
    accMag[i] = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az);
    gyroMag[i] = Math.sqrt(s.gx * s.gx + s.gy * s.gy + s.gz * s.gz);
  }

  const axMean = mean(ax); const axStd = std(ax, axMean);
  const ayMean = mean(ay); const ayStd = std(ay, ayMean);
  const azMean = mean(az); const azStd = std(az, azMean);

  const gxMean = mean(gx); const gxStd = std(gx, gxMean);
  const gyMean = mean(gy); const gyStd = std(gy, gyMean);
  const gzMean = mean(gz); const gzStd = std(gz, gzMean);

  const accMagMean = mean(accMag); const accMagStd = std(accMag, accMagMean);
  const accMagMax = Math.max(...accMag);
  const accMagEnergy = accMag.reduce((acc, v) => acc + v * v, 0) / n;

  const gyroMagMean = mean(gyroMag); const gyroMagStd = std(gyroMag, gyroMagMean);
  const gyroMagMax = Math.max(...gyroMag);
  const gyroMagEnergy = gyroMag.reduce((acc, v) => acc + v * v, 0) / n;

  const axPtp = ptp(ax); const ayPtp = ptp(ay); const azPtp = ptp(az);
  const gxPtp = ptp(gx); const gyPtp = ptp(gy); const gzPtp = ptp(gz);

  const corrAxAy = correlation(ax, ay, axMean, ayMean, axStd, ayStd);
  const corrAxAz = correlation(ax, az, axMean, azMean, axStd, azStd);
  const corrAyAz = correlation(ay, az, ayMean, azMean, ayStd, azStd);

  return [
    axMean, axStd, ayMean, ayStd, azMean, azStd,
    gxMean, gxStd, gyMean, gyStd, gzMean, gzStd,
    accMagMean, accMagStd, accMagMax, accMagEnergy,
    gyroMagMean, gyroMagStd, gyroMagMax, gyroMagEnergy,
    axPtp, ayPtp, azPtp, gxPtp, gyPtp, gzPtp,
    corrAxAy, corrAxAz, corrAyAz
  ];
}

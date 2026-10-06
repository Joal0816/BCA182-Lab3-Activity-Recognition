import numpy as np

FEATURE_NAMES = [
    # Accel mean & std
    "ax_mean", "ax_std", "ay_mean", "ay_std", "az_mean", "az_std",
    # Gyro mean & std
    "gx_mean", "gx_std", "gy_mean", "gy_std", "gz_mean", "gz_std",
    # Magnitudes mean, std, max, energy
    "acc_mag_mean", "acc_mag_std", "acc_mag_max", "acc_mag_energy",
    "gyro_mag_mean", "gyro_mag_std", "gyro_mag_max", "gyro_mag_energy",
    # Range / Peak-to-peak
    "ax_ptp", "ay_ptp", "az_ptp", "gx_ptp", "gy_ptp", "gz_ptp",
    # Cross-axis correlation
    "corr_ax_ay", "corr_ax_az", "corr_ay_az"
]

def extract_features_from_arrays(ax, ay, az, gx, gy, gz):
    """Computes fixed-length feature vector from sensor timeseries arrays."""
    # Magnitudes
    acc_mag = np.sqrt(ax**2 + ay**2 + az**2)
    gyro_mag = np.sqrt(gx**2 + gy**2 + gz**2)
    
    # Pairwise correlations
    def safe_corr(u, v):
        std_u = np.std(u)
        std_v = np.std(v)
        if std_u < 1e-6 or std_v < 1e-6:
            return 0.0
        return float(np.corrcoef(u, v)[0, 1])

    feats = [
        float(np.mean(ax)), float(np.std(ax)),
        float(np.mean(ay)), float(np.std(ay)),
        float(np.mean(az)), float(np.std(az)),
        float(np.mean(gx)), float(np.std(gx)),
        float(np.mean(gy)), float(np.std(gy)),
        float(np.mean(gz)), float(np.std(gz)),
        float(np.mean(acc_mag)), float(np.std(acc_mag)),
        float(np.max(acc_mag)), float(np.mean(acc_mag**2)),
        float(np.mean(gyro_mag)), float(np.std(gyro_mag)),
        float(np.max(gyro_mag)), float(np.mean(gyro_mag**2)),
        float(np.ptp(ax)), float(np.ptp(ay)), float(np.ptp(az)),
        float(np.ptp(gx)), float(np.ptp(gy)), float(np.ptp(gz)),
        safe_corr(ax, ay), safe_corr(ax, az), safe_corr(ay, az)
    ]
    return feats

def extract_features(samples):
    """
    Input: list of dicts with keys ax, ay, az, gx, gy, gz.
    """
    if len(samples) < 2:
        raise ValueError("At least 2 samples required to extract temporal features")
    ax = np.array([s["ax"] for s in samples], dtype=float)
    ay = np.array([s["ay"] for s in samples], dtype=float)
    az = np.array([s["az"] for s in samples], dtype=float)
    gx = np.array([s["gx"] for s in samples], dtype=float)
    gy = np.array([s["gy"] for s in samples], dtype=float)
    gz = np.array([s["gz"] for s in samples], dtype=float)
    return extract_features_from_arrays(ax, ay, az, gx, gy, gz)

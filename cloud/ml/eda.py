import pandas as pd
import numpy as np

df = pd.read_csv("run_or_walk.csv")
print(f"Total samples: {len(df)}")
print("\nClass distribution:")
print(df['activity'].value_counts(normalize=True))

acc_cols = ['acceleration_x', 'acceleration_y', 'acceleration_z']
gyro_cols = ['gyro_x', 'gyro_y', 'gyro_z']

df['acc_mag'] = np.sqrt(np.sum(df[acc_cols]**2, axis=1))
df['gyro_mag'] = np.sqrt(np.sum(df[gyro_cols]**2, axis=1))

print("\nMean Accelerometer Magnitude by Activity (0=walk, 1=run):")
print(df.groupby('activity')['acc_mag'].describe())

print("\nMean Gyroscope Magnitude by Activity (0=walk, 1=run):")
print(df.groupby('activity')['gyro_mag'].describe())

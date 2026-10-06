import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from features import FEATURE_NAMES, extract_features_from_arrays

print("Loading dataset...")
df = pd.read_csv("run_or_walk.csv")

# Windowing parameters: 1-second window ~= 5-10 samples in Kaggle dataset chunks
# We extract contiguous windows of size 10 (with 50% overlap step 5)
WINDOW_SIZE = 10
STEP_SIZE = 5

ax = df['acceleration_x'].values
ay = df['acceleration_y'].values
az = df['acceleration_z'].values
gx = df['gyro_x'].values
gy = df['gyro_y'].values
gz = df['gyro_z'].values
activity = df['activity'].values
dates = df['date'].values

X = []
y = []
window_dates = []

print("Extracting sliding windows...")
for i in range(0, len(df) - WINDOW_SIZE + 1, STEP_SIZE):
    # Ensure window doesn't cross dates/sessions
    if dates[i] != dates[i + WINDOW_SIZE - 1]:
        continue
    # Label is majority in window
    window_act = activity[i:i + WINDOW_SIZE]
    if len(np.unique(window_act)) > 1:
        continue # skip boundary transition windows
    
    feats = extract_features_from_arrays(
        ax[i:i+WINDOW_SIZE], ay[i:i+WINDOW_SIZE], az[i:i+WINDOW_SIZE],
        gx[i:i+WINDOW_SIZE], gy[i:i+WINDOW_SIZE], gz[i:i+WINDOW_SIZE]
    )
    X.append(feats)
    y.append(int(window_act[0]))
    window_dates.append(dates[i])

X = np.array(X)
y = np.array(y)
window_dates = np.array(window_dates)

print(f"Total valid windows: {len(X)}")

# Chronological split by date to prevent leakage
unique_dates = sorted(list(set(window_dates)))
train_dates = unique_dates[:int(len(unique_dates)*0.75)]
test_dates = unique_dates[int(len(unique_dates)*0.75):]

train_mask = np.isin(window_dates, train_dates)
test_mask = np.isin(window_dates, test_dates)

X_train, y_train = X[train_mask], y[train_mask]
X_test, y_test = X[test_mask], y[test_mask]

print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train Primary: Logistic Regression (Lightweight, probabilistic, highly interpretable)
print("Training Logistic Regression...")
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train_scaled, y_train)

y_pred_lr = lr.predict(X_test_scaled)
y_prob_lr = lr.predict_proba(X_test_scaled)[:, 1]

# Train Secondary Comparator: Random Forest
print("Training Random Forest...")
rf = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
rf.fit(X_train, y_train)
y_pred_rf = rf.predict(X_test)
y_prob_rf = rf.predict_proba(X_test)[:, 1]

metrics = {
    "logistic_regression": {
        "accuracy": float(accuracy_score(y_test, y_pred_lr)),
        "precision": float(precision_score(y_test, y_pred_lr)),
        "recall": float(recall_score(y_test, y_pred_lr)),
        "f1": float(f1_score(y_test, y_pred_lr)),
        "roc_auc": float(roc_auc_score(y_test, y_prob_lr)),
        "confusion_matrix": confusion_matrix(y_test, y_pred_lr).tolist()
    },
    "random_forest": {
        "accuracy": float(accuracy_score(y_test, y_pred_rf)),
        "precision": float(precision_score(y_test, y_pred_rf)),
        "recall": float(recall_score(y_test, y_pred_rf)),
        "f1": float(f1_score(y_test, y_pred_rf)),
        "roc_auc": float(roc_auc_score(y_test, y_prob_rf)),
        "confusion_matrix": confusion_matrix(y_test, y_pred_rf).tolist()
    }
}

print("\n--- RESULTS ---")
print("Logistic Regression Metrics:", metrics["logistic_regression"])
print("Random Forest Metrics:", metrics["random_forest"])

# Export model.json
model_spec = {
    "model_version": "logreg-v1-rtspark",
    "type": "logistic_regression",
    "feature_names": FEATURE_NAMES,
    "coefficients": lr.coef_[0].tolist(),
    "intercept": float(lr.intercept_[0]),
    "classes": ["walk", "run"],
    "scaler": {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist()
    },
    "window_size": WINDOW_SIZE,
    "metrics": metrics["logistic_regression"]
}

with open("model.json", "w") as f:
    json.dump(model_spec, f, indent=2)

with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

# Export golden test vectors
goldens = []
# Pick 3 walk and 3 run test windows
walk_indices = np.where(y_test == 0)[0][:3]
run_indices = np.where(y_test == 1)[0][:3]

for idx in list(walk_indices) + list(run_indices):
    label_name = "walk" if y_test[idx] == 0 else "run"
    goldens.append({
        "name": f"test_{label_name}_{idx}",
        "label": label_name,
        "features": X_test[idx].tolist(),
        "prob_run": float(y_prob_lr[idx]),
        "prob_walk": float(1.0 - y_prob_lr[idx])
    })

with open("goldens.json", "w") as f:
    json.dump({"goldens": goldens}, f, indent=2)

print("\nGenerated model.json, metrics.json, and goldens.json successfully!")

# BCA 182 Laboratory Activity 3: Activity Recognition (IoT + ML + RT-Spark)

Department of Computer Applications, MSU-IIT  
Course: BCA 182 Embedded Systems Programming

## Architecture Overview
1. **Edge Node:** RT-Spark (STM32F407ZGT6) with LSM6DSL 6-axis IMU & ISM43362 Wi-Fi publishing AWS coreMQTT telemetry payloads.
2. **Cloud ML:** Temporal sliding-window Logistic Regression (99.98% Accuracy on Kaggle Run-or-Walk benchmark).
3. **Cloud API & Ingest:** Serverless TypeScript endpoints with Supabase persistence.
4. **Client PWA:** Kinesis OS Progressive Web App built with React, Tailwind, and offline service worker.
5. **Mobile:** Android APK via Trusted Web Activity (TWA) Bubblewrap container.

## Deliverables Index
- `firmware/`: STM32Cube / FreeRTOS / PlatformIO firmware implementation.
- `cloud/ml/`: Feature engineering, training script, exported weights (`model.json`), and golden validation suite.
- `cloud/api/`: Ingestion webhook, prediction, and history REST endpoints.
- `web/`: Production-grade PWA with impeccable styling.
- `docs/`: DNS configuration and Android APK packaging instructions.

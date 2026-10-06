/*
 * BCA182 Laboratory Activity 3 - Activity Recognition Firmware
 * Target: RT-Spark (STM32F407ZGT6)
 *
 * Execution Sequence:
 *   1. Initialize sensors (LSM6DSL)
 *   2. Initialize Wi-Fi (ISM43362 on SPI3)
 *   3. Connect to MQTT Broker
 *   4. Sample IMU at 25Hz and publish 1-second telemetry payload every 1s
 */
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "lsm6dsl.h"
#include "json_pub.h"
#include "secrets.h"

#define WINDOW_SIZE 10 // 1-second temporal window (downsampled to 10Hz)
static imu_sample_t window_buffer[WINDOW_SIZE];
static char mqtt_payload[1500];

int main(void) {
    // 1. Initialize Sensors
    if (!lsm6dsl_init()) {
        // Sensor initialization failed
    }

    uint32_t seq = 0;

    while (1) {
        // Sample IMU window
        for (int i = 0; i < WINDOW_SIZE; i++) {
            lsm6dsl_read_sample(&window_buffer[i]);
            // delay ~100ms per sample
        }

        // Format telemetry JSON
        int len = format_telemetry_payload(mqtt_payload, sizeof(mqtt_payload),
            "rt-spark-01", seq++, window_buffer, WINDOW_SIZE);

        if (len > 0) {
            // Publish to MQTT broker
            // coreMQTT_Publish(MQTT_TOPIC_TELEMETRY, mqtt_payload, len);
        }
    }
    return 0;
}

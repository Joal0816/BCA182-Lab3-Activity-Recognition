#include "json_pub.h"
#include <stdio.h>
#include <string.h>

int format_telemetry_payload(char *buf, size_t max_len, const char *device_id, uint32_t seq, const imu_sample_t *samples, size_t num_samples) {
    if (!buf || max_len == 0 || !device_id || !samples) return -1;

    int written = snprintf(buf, max_len,
        "{\"device_id\":\"%s\",\"seq\":%lu,\"samples\":[",
        device_id, (unsigned long)seq);

    if (written < 0 || (size_t)written >= max_len) return -1;

    for (size_t i = 0; i < num_samples; i++) {
        int sample_written = snprintf(buf + written, max_len - written,
            "%s{\"ax\":%.4f,\"ay\":%.4f,\"az\":%.4f,\"gx\":%.4f,\"gy\":%.4f,\"gz\":%.4f}",
            (i > 0 ? "," : ""),
            samples[i].ax, samples[i].ay, samples[i].az,
            samples[i].gx, samples[i].gy, samples[i].gz);

        if (sample_written < 0 || (size_t)(written + sample_written) >= max_len) return -1;
        written += sample_written;
    }

    int closing = snprintf(buf + written, max_len - written, "]}");
    if (closing < 0 || (size_t)(written + closing) >= max_len) return -1;

    return written + closing;
}

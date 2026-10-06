#ifndef JSON_PUB_H
#define JSON_PUB_H

#include "lsm6dsl.h"
#include <stddef.h>

int format_telemetry_payload(char *buf, size_t max_len, const char *device_id, uint32_t seq, const imu_sample_t *samples, size_t num_samples);

#endif // JSON_PUB_H

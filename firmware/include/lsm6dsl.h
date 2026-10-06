#ifndef LSM6DSL_H
#define LSM6DSL_H

#include <stdint.h>
#include <stdbool.h>

#define LSM6DSL_I2C_ADDR_LOW   0x6A // SA0 to GND
#define LSM6DSL_I2C_ADDR_HIGH  0x6B // SA0 to VDD
#define LSM6DSL_WHO_AM_I_REG   0x0F
#define LSM6DSL_WHO_AM_I_VAL   0x6A

#define LSM6DSL_CTRL1_XL       0x10
#define LSM6DSL_CTRL2_G        0x11
#define LSM6DSL_CTRL3_C        0x12
#define LSM6DSL_OUTX_L_G       0x22
#define LSM6DSL_OUTX_L_XL      0x28

// LSM6DSL Conversion Constants
// Accel FS = +/-2g -> Sensitivity: 0.061 mg/LSB -> 0.000061 g/LSB
#define LSM6DSL_ACC_SENSITIVITY_2G  0.000061f

// Gyro FS = +/-2000 dps -> Sensitivity: 70 mdps/LSB -> 0.070 dps/LSB
// To radians/second: 0.070 * (PI / 180) = 0.001221730476 rad/s per LSB
#define LSM6DSL_GYRO_SENSITIVITY_RAD_S 0.001221730476f

typedef struct {
    float ax, ay, az; // in g
    float gx, gy, gz; // in rad/s
} imu_sample_t;

bool lsm6dsl_init(void);
bool lsm6dsl_read_sample(imu_sample_t *sample);

#endif // LSM6DSL_H

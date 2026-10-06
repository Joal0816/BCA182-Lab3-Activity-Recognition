#include "lsm6dsl.h"
#include <string.h>

#ifndef NATIVE_TEST
#include "stm32f4xx_hal.h"
extern I2C_HandleTypeDef hi2c1;
#define SENSOR_I2C_HANDLE hi2c1
#endif

bool lsm6dsl_init(void) {
#ifndef NATIVE_TEST
    uint8_t who_am_i = 0;
    HAL_I2C_Mem_Read(&SENSOR_I2C_HANDLE, LSM6DSL_I2C_ADDR_LOW << 1, LSM6DSL_WHO_AM_I_REG, 1, &who_am_i, 1, 100);
    if (who_am_i != LSM6DSL_WHO_AM_I_VAL && who_am_i != 0x6F) {
        return false;
    }

    // Set ODR_XL = 52Hz, FS_XL = +/-2g
    uint8_t ctrl1 = 0x30;
    HAL_I2C_Mem_Write(&SENSOR_I2C_HANDLE, LSM6DSL_I2C_ADDR_LOW << 1, LSM6DSL_CTRL1_XL, 1, &ctrl1, 1, 100);

    // Set ODR_G = 52Hz, FS_G = +/-2000 dps
    uint8_t ctrl2 = 0x3C;
    HAL_I2C_Mem_Write(&SENSOR_I2C_HANDLE, LSM6DSL_I2C_ADDR_LOW << 1, LSM6DSL_CTRL2_G, 1, &ctrl2, 1, 100);

    // Auto-increment register address during multi-byte read (IF_INC bit 2)
    uint8_t ctrl3 = 0x04;
    HAL_I2C_Mem_Write(&SENSOR_I2C_HANDLE, LSM6DSL_I2C_ADDR_LOW << 1, LSM6DSL_CTRL3_C, 1, &ctrl3, 1, 100);
#endif
    return true;
}

bool lsm6dsl_read_sample(imu_sample_t *sample) {
    if (!sample) return false;
#ifndef NATIVE_TEST
    uint8_t raw_data[12];
    // Read 6 bytes gyro (0x22..0x27) and 6 bytes accel (0x28..0x2D)
    if (HAL_I2C_Mem_Read(&SENSOR_I2C_HANDLE, LSM6DSL_I2C_ADDR_LOW << 1, LSM6DSL_OUTX_L_G, 1, raw_data, 12, 100) != HAL_OK) {
        return false;
    }

    int16_t gx_raw = (int16_t)((raw_data[1] << 8) | raw_data[0]);
    int16_t gy_raw = (int16_t)((raw_data[3] << 8) | raw_data[2]);
    int16_t gz_raw = (int16_t)((raw_data[5] << 8) | raw_data[4]);

    int16_t ax_raw = (int16_t)((raw_data[7] << 8) | raw_data[6]);
    int16_t ay_raw = (int16_t)((raw_data[9] << 8) | raw_data[8]);
    int16_t az_raw = (int16_t)((raw_data[11] << 8) | raw_data[10]);

    sample->ax = ax_raw * LSM6DSL_ACC_SENSITIVITY_2G;
    sample->ay = ay_raw * LSM6DSL_ACC_SENSITIVITY_2G;
    sample->az = az_raw * LSM6DSL_ACC_SENSITIVITY_2G;

    sample->gx = gx_raw * LSM6DSL_GYRO_SENSITIVITY_RAD_S;
    sample->gy = gy_raw * LSM6DSL_GYRO_SENSITIVITY_RAD_S;
    sample->gz = gz_raw * LSM6DSL_GYRO_SENSITIVITY_RAD_S;
#else
    sample->ax = 0.25f; sample->ay = -0.78f; sample->az = -0.05f;
    sample->gx = -0.05f; sample->gy = 0.03f; sample->gz = -2.9f;
#endif
    return true;
}

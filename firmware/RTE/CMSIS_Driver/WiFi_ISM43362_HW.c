/*
 * WiFi_ISM43362_HW.c - Inventek ISM43362 Hardware Pin Binding for RT-Spark
 *
 * Board: RT-Thread RT-Spark (STM32F407ZGT6)
 * Bus: SPI3 (Global Interrupt Enabled)
 */
#include "stm32f4xx_hal.h"

// Pin Definitions for RT-Spark ISM43362
#define WIFI_RESET_PIN         GPIO_PIN_14
#define WIFI_RESET_PORT        GPIOB
#define WIFI_WAKEUP_PIN        GPIO_PIN_15
#define WIFI_WAKEUP_PORT       GPIOB
#define WIFI_NSS_PIN           GPIO_PIN_15
#define WIFI_NSS_PORT          GPIOA
#define WIFI_DATARDY_PIN       GPIO_PIN_1
#define WIFI_DATARDY_PORT      GPIOD

void WiFi_ISM43362_HW_Init(void) {
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOD_CLK_ENABLE();

    // NSS
    GPIO_InitStruct.Pin = WIFI_NSS_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    HAL_GPIO_Init(WIFI_NSS_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(WIFI_NSS_PORT, WIFI_NSS_PIN, GPIO_PIN_SET);

    // Reset & Wakeup
    GPIO_InitStruct.Pin = WIFI_RESET_PIN | WIFI_WAKEUP_PIN;
    HAL_GPIO_Init(WIFI_RESET_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(WIFI_RESET_PORT, WIFI_RESET_PIN, GPIO_PIN_SET);
    HAL_GPIO_WritePin(WIFI_RESET_PORT, WIFI_WAKEUP_PIN, GPIO_PIN_SET);

    // DataReady Interrupt
    GPIO_InitStruct.Pin = WIFI_DATARDY_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(WIFI_DATARDY_PORT, &GPIO_InitStruct);
}

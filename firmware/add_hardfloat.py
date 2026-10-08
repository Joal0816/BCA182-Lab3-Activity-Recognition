Import("env")

# Ensure GCC driver passes hardware floating-point flags to the linker for Cortex-M4F
env.Append(
    LINKFLAGS=[
        "-mfloat-abi=hard",
        "-mfpu=fpv4-sp-d16",
    ]
)

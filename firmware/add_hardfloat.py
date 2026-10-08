Import("env")

# Ensure GCC driver passes hardware floating-point and float printf flags
env.Append(
    LINKFLAGS=[
        "-mfloat-abi=hard",
        "-mfpu=fpv4-sp-d16",
        "-u", "_printf_float",
    ]
)

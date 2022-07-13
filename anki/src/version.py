# NOTE should be same as under ../../src/version.ts
versionInfo = [
    0,  # MAJOR
    6,  # MINOR
    0,  # PATCH
]

prereleaseInfo = []

version = ".".join([str(comp) for comp in versionInfo]) + (
    f'-{".".join([str(comp) for comp in prereleaseInfo])}'
    if len(prereleaseInfo) > 0
    else ""
)

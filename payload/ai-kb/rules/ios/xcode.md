# Xcode

## Build Settings
- Use `.xcconfig` files
- Debug: `ONLY_ACTIVE_ARCH=YES`
- Release: `SWIFT_OPTIMIZATION_LEVEL=-O`, `COMPILATION_MODE=wholemodule`
- Enable **Explicit Build Modules** for faster builds (Xcode 16)

## Xcode 16 Features
- Predictive code completion (on-device AI)
- Swift Assist (cloud AI, requires macOS Sequoia)
- DWARF5 debug symbols (faster debugging)
- Flame Graph in Instruments

## Code Signing
- Automatic for dev, manual for distribution, fastlane `match` for teams

## Dependencies
- SPM preferred, CocoaPods for legacy

## Common Issues
| Issue | Fix |
|-------|-----|
| "No such module" | Clean, delete DerivedData, pod install |
| Code signing failed | Verify certs, regenerate profiles |
| Indexing stuck | Delete DerivedData, restart Xcode |

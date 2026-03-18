# Mobile Security

## SSL/TLS Pinning
- Pin intermediate CA or leaf certificate (NOT root)
- Include backup pins for rotation
- Only pin endpoints you control
- Use Network Security Config (Android) or TrustKit (iOS)
- Consider as defense-in-depth, not primary security

## Binary Protection
- Code obfuscation (R8/ProGuard, SwiftShield)
- Anti-tampering detection
- Debug detection in release builds

## Secure Storage
- Use platform secure storage (Keychain, EncryptedSharedPreferences)
- Never store secrets in app bundle/APK

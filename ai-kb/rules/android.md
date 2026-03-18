# Android Best Practices

Quick reference for Android development. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Lifecycle | `android/lifecycle.md` | Activity, Fragment, ViewModel |
| Compose | `android/compose.md` | State, recomposition, side effects |
| Navigation | `android/navigation.md` | Nav3, type-safe routes, adaptive |
| Coroutines | `android/coroutines.md` | Dispatchers, structured concurrency |
| Data | `android/data.md` | Koin, WorkManager, DataStore |
| Build | `android/build.md` | Gradle, R8, Baseline Profiles |
| Testing | `android/testing.md` | Unit, UI, Compose tests |

---

## Quick Reference: Top Mistakes

1. **Lifecycle**: `this` instead of `viewLifecycleOwner` in Fragments
2. **Compose**: Backwards writes, unstable classes causing recomposition
3. **StateFlow**: Not using `repeatOnLifecycle` when collecting
4. **Navigation**: Hardcoded routes instead of type-safe navigation
5. **Coroutines**: `GlobalScope`, hardcoded dispatchers, breaking structured concurrency
6. **DI**: Service locator pattern over constructor injection
7. **Gradle**: Dynamic dependency versions (`+`)
8. **R8**: Missing keep rules for reflection/serialization
9. **Performance**: Blocking main thread, no Baseline Profiles
10. **Security**: Plain SharedPreferences for secrets

---

## Security Quick Reference

### Secure Storage
- `EncryptedSharedPreferences` with `MasterKey.KeyScheme.AES256_GCM`
- Android Keystore for cryptographic keys

### Network
- `network_security_config.xml` with `cleartextTrafficPermitted="false"`
- Certificate pinning via `CertificatePinner` (OkHttp)

### App Signing
- Use Google Play App Signing
- Never commit keystores to VCS

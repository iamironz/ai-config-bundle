# Android Build & Performance

## Gradle Optimization

### Version Catalogs
Use `libs.versions.toml` with `[versions]`, `[libraries]`, `[bundles]`, `[plugins]`

### Build Performance
- `org.gradle.parallel=true`
- `org.gradle.caching=true`
- `org.gradle.configuration-cache=true`

### Key Practices
- `implementation` over `api` (reduces recompilation)
- Static dependency versions (never `+`)
- Enable non-transitive R classes
- Migrate kapt to KSP
- Put `gradlePluginPortal()` last in repositories

---

## ProGuard/R8

### Setup
- `minifyEnabled = true`, `shrinkResources = true`
- Use `proguard-android-optimize.txt` + custom rules

### R8 Full Mode
- Enable for ~30% ANR reduction, better optimization
- Migration: `android.enableR8.fullMode=true`
- May require additional keep rules for legacy code

### Common Rules
- `-keep class com.example.models.** { *; }` — data classes
- `-keepattributes *Annotation*` — annotations

---

## Performance

### Startup
- **Baseline Profiles** — precompile hot code paths (30-50% improvement)
- Generate via `BaselineProfileRule` in macrobenchmark tests
- Cold < 2s (max 5s), warm < 2s, hot < 1.5s

### Memory
- Avoid static Activity/Context refs, inner class refs, unregistered listeners
- Use `LeakCanary` in debug builds

### ANR Prevention
- No I/O/network/heavy computation on main thread
- Use `Dispatchers.IO`/`Default`
- Enable `StrictMode` in debug

### Battery
- `WorkManager` with constraints, batch requests, exponential backoff

# Kotlin Multiplatform (KMP)

## expect/actual
- `expect` in commonMain defines interface
- `actual` in platform modules provides implementation
- Visibility must match or be more permissive

## Source Sets
- `commonMain`, `androidMain`, `iosMain`
- Intermediate: `nativeMain` for shared native code

## iOS Interop
- KMP-NativeCoroutines for Swift async/await mapping
- Watch for reference cycles with Kotlin objects in iOS
- SKIE plugin for better Swift/Xcode experience

## File Operations
- **ALWAYS** use `Dispatchers.IO` for file I/O
- Atomic writes: write to temp file, then rename
- Sanitize user-provided paths (remove `..`, `/`, `\`)

## Research
- Kotlin/Native ↔ Swift interop reference: https://github.com/kotlin-hands-on/kotlin-swift-interopedia
- Kotlin/Native Objective-C interop docs: https://kotlinlang.org/docs/native-objc-interop.html
- Kotlin/Native Apple framework docs: https://kotlinlang.org/docs/apple-framework.html

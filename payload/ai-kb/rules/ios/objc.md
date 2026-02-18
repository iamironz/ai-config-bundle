# Objective-C

## Naming
- 3-letter class prefixes (2-letter reserved for Apple)
- Constants: `kMYCDefaultTimeout`, Category methods: `myc_` prefix

## Properties
- `nonatomic` (faster), `strong` (default), `weak` (delegates/IBOutlets)
- `copy` — **always for NSString, NSArray, NSDictionary**
- `assign` — primitives only

## Nullability (Swift Interop)
- Wrap headers in `NS_ASSUME_NONNULL_BEGIN/END`
- Mark nullable explicitly: `nullable` attribute
- Kotlin/Native ↔ Swift interop reference: https://github.com/kotlin-hands-on/kotlin-swift-interopedia
- Kotlin/Native Objective-C interop docs: https://kotlinlang.org/docs/native-objc-interop.html
- Kotlin/Native Apple framework docs: https://kotlinlang.org/docs/apple-framework.html

## Blocks & Retain Cycles
- `__weak typeof(self) weakSelf = self` before block
- `__strong typeof(self) strongSelf = weakSelf` inside block, nil-check before use

## Modern Features
- `instancetype` over `id`, `NS_ENUM()`/`NS_OPTIONS()`
- Literals: `@42`, `@[@"a"]`, `@{@"k": @"v"}`
- Lightweight generics: `NSArray<NSString *> *`

## Common Mistakes
- Not using `copy` for NSString, using `self` in retained blocks
- `==` instead of `isEqual:`, accessing properties in `init`/`dealloc`

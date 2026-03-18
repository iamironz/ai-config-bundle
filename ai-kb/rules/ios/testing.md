# iOS Testing

## Swift Testing Framework (New)
- `@Test` macro replaces `test` prefix
- `#expect` replaces `XCTAssert*` with better messages
- `#require` for unwrapping or failing
- Parameterized tests with `arguments:`
- Traits: `.tags()`, `.enabled(if:)`, `.timeLimit()`
- Parallel execution by default
- Coexists with XCTest

## XCTest Basics
- `@testable import`, mark tests as `throws`
- AAA pattern, `testX_givenY_shouldZ` naming
- `makeSUT()` factory for system under test

## UI Tests
- `accessibilityIdentifier` over labels (localization-safe)
- Page Object pattern, `waitForExistence(timeout:)` over sleep
- `continueAfterFailure = false` for sequences
- Specific queries: `app.navigationBars.buttons["save"].firstMatch`

## UI Test Utilities
- **System alerts**: `addUIInterruptionMonitor(withDescription:handler:)`
- **Grouping**: `XCTContext.runActivity(named:block:)`
- **Attachments**: `XCTAttachment(screenshot:)` with `.lifetime` control

## Mocking
- Protocol-oriented, inject via initializer
- Stubs for canned responses, mocks for verification

## Async Testing
- `async` test methods with `await`
- `await fulfillment(of:timeout:)` for expectations

## SwiftUI Testing
- Snapshot testing (swift-snapshot-testing)
- ViewInspector for hierarchy assertions

## Anti-Patterns
- Testing implementation not behavior
- Sharing state between tests, using `sleep()`
- Not mocking network/database
- Using labels for queries (breaks localization)

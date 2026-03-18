# Go Testing

## Table-Driven Tests

- Prefer table-driven tests for behavior coverage
- Use subtests (`t.Run`) for clear case isolation
- Keep test names descriptive and behavior-focused

## Parallel Tests

- Use `t.Parallel()` only for independent tests
- Avoid shared mutable state across parallel subtests
- Use deterministic fixtures to keep failures reproducible

## Fuzzing

- Add fuzz tests for parser/decoder/normalizer style logic
- Seed with representative edge cases
- Keep corpus inputs minimal and meaningful

## Benchmarks

- Use benchmarks to validate performance-sensitive paths
- Report allocations and compare before/after changes
- Avoid flaky benchmark environments when making claims

## Mocking and Test Doubles

- Mock through small interfaces
- Prefer fakes for behavior-driven tests when possible
- Do not mock value types unnecessarily

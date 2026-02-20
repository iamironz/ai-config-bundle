# JavaScript & TypeScript Async

## Promise Discipline

- Prefer `async`/`await` for readable control flow
- Do not leave floating promises; `await`, return, or explicitly detach
- Handle rejections at the correct boundary with operation context
- Prefer `Promise.all` for all-or-nothing parallel work

## Concurrency Patterns

- Use `Promise.allSettled` when partial results are acceptable
- Bound fan-out with a concurrency limit for IO-heavy workloads
- Keep shared mutable state out of concurrent execution paths
- Make retries idempotent and bounded

## Cancellation

- Use `AbortController` for cancellable operations
- Pass `signal` through layered APIs instead of creating hidden controllers
- Stop work on cancellation checks in loops and long pipelines
- Treat cancellation as expected control flow, not an error anomaly

## Event Loop Awareness

- Avoid long synchronous loops on request/UI-critical paths
- Keep microtask chains bounded; prevent starvation of timers and rendering
- Use worker threads/web workers for CPU-heavy jobs
- Use streaming/backpressure for large payload processing

## Anti-Patterns

- `await` inside serial loops when independent parallelism is intended
- Fire-and-forget operations without lifecycle ownership
- Swallowing errors in empty `catch` blocks

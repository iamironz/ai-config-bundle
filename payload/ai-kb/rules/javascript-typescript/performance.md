# JavaScript & TypeScript Performance

## Measure First

- Profile before optimizing
- Track p50/p95 latency, throughput, and memory for critical flows
- Validate performance claims with repeatable benchmarks
- Re-check after changes to avoid regressions

## Event Loop and CPU

- Keep synchronous work small on hot paths
- Move CPU-heavy work to worker threads/web workers
- Prefer streaming over full-buffer processing for large payloads
- Avoid accidental quadratic algorithms in transform pipelines

## Node Runtime Patterns

- Avoid sync filesystem calls in request-handling paths
- Reuse connections and clients instead of per-request construction
- Apply backpressure-aware IO patterns for high-volume processing
- Bound queue sizes and parallel fan-out

## Frontend and Bundle Efficiency

- Split code by route/feature boundaries
- Defer non-critical modules and third-party scripts
- Keep dependency footprint lean and audited
- Avoid repeated object/array recreation in render-hot paths

## Memory and Lifecycle

- Clean up timers, listeners, and subscriptions
- Avoid accidental retention via long-lived closures
- Scope caches with eviction strategy and ownership
- Monitor heap growth in long-running processes

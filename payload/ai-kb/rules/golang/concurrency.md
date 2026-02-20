# Go Concurrency

## Goroutines

- Every goroutine needs a termination path
- Use context cancellation for cooperative shutdown
- Use `sync.WaitGroup` for lifecycle coordination
- Use `errgroup.Group` when you need cancellation on first error
- Use `errgroup.SetLimit(n)` to bound parallelism

## Channels

- Choose channel buffering intentionally (0 for sync handoff, buffered for decoupling)
- Close channels from the producer side only
- Use `for range ch` to consume until close
- Use `select` for cancellation and timeout-aware operations

## Synchronization

- Protect shared mutable state with `sync.Mutex` or `sync.RWMutex`
- Never copy values that contain a mutex
- Use `sync.Once` variants for one-time initialization
- Use atomics only when invariants remain simple and auditable

## Common Patterns

- Worker pool for bounded throughput
- Fan-out/fan-in for parallel independent work
- Pipeline stages connected by channels
- Rate limiting via token bucket or timed dispatch

## Leak Prevention

- Check `ctx.Done()` in loops and blocking selects
- Ensure blocked sends/receives can exit during shutdown
- Avoid detached goroutines without ownership or cancellation

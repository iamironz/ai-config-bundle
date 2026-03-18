# JavaScript & TypeScript Best Practices

Quick reference for JavaScript and TypeScript development. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Fundamentals | `javascript-typescript/fundamentals.md` | Naming, modules, immutability, boundaries |
| TypeScript | `javascript-typescript/typescript.md` | Strict config, narrowing, generics, API types |
| Async | `javascript-typescript/async.md` | Promise patterns, cancellation, concurrency limits |
| Runtime | `javascript-typescript/runtime.md` | Node/browser/edge boundaries, env, package hygiene |
| Testing | `javascript-typescript/testing.md` | Pyramid, deterministic tests, mocks, snapshots |
| Performance | `javascript-typescript/performance.md` | Event loop, bundle size, memory, profiling |

---

## Quick Reference: Top Mistakes

1. **Types**: Overusing `any` and losing type safety at boundaries
2. **Async**: Floating promises and unhandled rejections
3. **Modules**: Mixing ESM and CommonJS patterns in one package without intent
4. **State**: Shared mutable objects leaking across modules
5. **Runtime**: Using Node-only APIs in browser/edge code paths
6. **Testing**: Real network/time dependencies in unit tests
7. **Performance**: Long synchronous work on request/UI-critical paths
8. **Tooling**: Multiple lockfiles and inconsistent package manager usage

## Modern Baseline

- Prefer TypeScript for application and library code
- Use ESM consistently unless a clear compatibility constraint exists
- Validate external input at IO boundaries before domain logic
- Treat lint and type checks as quality gates, not optional hints

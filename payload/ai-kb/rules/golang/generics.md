# Go Generics

## Basics

- Type parameters: `func Map[T any](...) ...`
- Constraints limit valid types (`any`, `comparable`, custom interfaces)
- `~T` matches types with underlying type `T`

## When to Use

- Use generics when behavior is identical across types
- Prefer interfaces when behavior differs by implementation
- Favor readability over abstraction depth

## Best Practices

- Keep constraints minimal but meaningful
- Let compiler inference work; avoid noisy explicit type arguments
- Keep generic APIs small and composable
- Avoid deeply nested type parameters that obscure intent

## Standard Constraints

- `comparable` for map keys and equality checks
- Ordered constraints for `<` and `>` comparisons where needed

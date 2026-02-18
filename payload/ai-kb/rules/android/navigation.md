# Android Navigation

## Navigation 3 (Nav3) — Stable Nov 2025
- Full backstack control via `NavBackStack`, single source of truth
- Use `NavDisplay` with scene strategies for transitions
- Supports multi-pane/adaptive layouts natively
- Nav2 is now legacy — migrate new projects to Nav3

## Type-Safe Navigation (2.8+)
- Use `@Serializable` sealed classes/data classes for routes
- `composable<Route>` + `backStackEntry.toRoute<Route>()`
- `navController.navigate(Route(args))`

## Deep Links
- API 33+ requires verification via `assetlinks.json`
- Handle `onNewIntent()` in single-activity apps
- Always use Safe Args over hardcoded strings

---

## Material 3 Adaptive

### Window Size Classes
- Compact (<600dp), Medium (600-839dp), Expanded (840dp+)
- Use `calculateWindowSizeClass()` to determine current class

### Canonical Layouts
- `ListDetailPaneScaffold` — master-detail on tablets
- `SupportingPaneScaffold` — main + supporting content
- `NavigationSuiteScaffold` — auto-switches rail/drawer/bar

### Strategies
- **Reflow**: Stack → side-by-side based on width
- **Levitate**: Promote secondary content to primary position

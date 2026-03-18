# Code Quality

Quick reference for code quality. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Metrics | `code-quality/metrics.md` | Size limits, complexity, cognitive load |
| Review | `code-quality/review.md` | 10-step checklist, PR standards |
| Tech Debt | `code-quality/tech-debt.md` | Quantification, management strategies |
| Refactoring | `code-quality/refactoring.md` | When to split, extract patterns, directory organization |

---

## Quick Reference: Size Limits

> **NO EXCEPTIONS** — these limits apply to ALL files including tests.

| Metric | Ideal | Hard Limit | Exceptions |
|--------|-------|------------|------------|
| **Functions** | 20-50 lines | 80 max | NONE |
| **Files** | 200-400 lines | 500 max | NONE |
| **Directories** | 5-7 files | 10 max | NONE |
| **Line width** | 80 chars | 100 max | URLs, strings |
| **Nesting** | 2 levels | 3 max | NONE |
| **Parameters** | 2-3 | 4 max | NONE |
| **Complexity** | 5-7 | 10 max | NONE |

### Test Files Are NOT Exempt

- ❌ "Test files can be longer" — FALSE
- ❌ "Integration tests need more lines" — FALSE, split into multiple files
- ✅ Split test files by: feature, layer, scenario type

## Auto-Fix (Immediate, 1-3 files)

- File too large → Split
- Function too large → Extract
- Dead code → Delete
- Commented-out code → Delete
- Duplicated code → Extract

## Ask First (5+ files)

- Large refactoring
- Architectural changes

## SOLID Principles Quick Check

| Principle | Check | Violation Sign |
|-----------|-------|----------------|
| **SRP** | One reason to change? | Class with AND in description |
| **OCP** | Extend without modifying? | Switch on type |
| **LSP** | Subclass replaces parent? | Unexpected exceptions |
| **ISP** | Clients use all methods? | Empty/stub implementations |
| **DIP** | Depend on abstractions? | Direct instantiation |

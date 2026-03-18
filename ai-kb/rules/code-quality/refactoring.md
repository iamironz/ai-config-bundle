# Refactoring Patterns

## When to Split Files
- Multiple unrelated classes
- Multiple responsibilities
- Hard to navigate
- Exceeds project limit

## When to Extract Functions
- Size > 80 lines AND complex
- Multiple nesting levels (> 3)
- Multiple responsibilities
- Reusable logic spotted

## Acceptable Large Functions
- Complex but cohesive validation
- Route handlers with sequential steps
- Test setup with many steps
- Atomic transactions

## Split Patterns
**By responsibility:** Validation, mapping, storage
**By domain:** Auth, activity, etc.
**By type:** Constants, configuration

## Directory Organization

### Before Adding a File
1. Check current folder file count
2. If > 10 files → consider subfolder or find existing appropriate folder
3. If adding related files → group in subfolder from the start

### When to Create Subfolder
- Folder has 10+ files
- New file has distinct responsibility
- Multiple related files being added
- Logical grouping emerges (e.g., `models/`, `utils/`, `mappers/`)

### When to Move to Existing Folder
- File fits existing subfolder's responsibility
- Similar files already grouped elsewhere
- File is misplaced in current location

### DON'T
- Add files to already crowded folders
- Create flat structures with 20+ files
- Mix unrelated concerns in same folder
- Create single-file subfolders (unless expecting growth)

## Extract Patterns
- Helper functions for reusable logic
- Named conditionals: `if (isEligible())` vs complex condition
- Early returns to reduce nesting

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | snake_case/camelCase | `customer_name`, `orderTotal` |
| Functions | verb + object | `calculateScore()`, `validateInput()` |
| Classes | PascalCase, nouns | `OrderProcessor` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Booleans | is_, has_, should_ | `is_valid`, `has_permission` |

## Naming Anti-Patterns
- Single-letter names (except `i`, `j`, `k` in loops)
- Generic: `data`, `info`, `temp`, `result`
- Abbreviations not widely understood
- Misleading names

## Hygiene
- No dead code
- No commented-out code
- Descriptive names
- No duplication
- No verbose/obsolete comments

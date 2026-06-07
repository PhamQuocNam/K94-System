---
description: Run linters and auto-fix code style issues for FastAPI projects
argument-hint: [path] [--check-only]
allowed-tools: Bash(uv:*), Read, Edit
---

# FastAPI Lint & Format Command

## Linter Configuration Detection

- Ruff config: !`cat pyproject.toml 2>/dev/null | grep -A 20 '\[tool.ruff\]' | head -25 || cat ruff.toml 2>/dev/null | head -20 || echo "No ruff config found"`
- Mypy config: !`cat pyproject.toml 2>/dev/null | grep -A 10 '\[tool.mypy\]' | head -15 || cat mypy.ini 2>/dev/null | head -15 || echo "No mypy config found"`
- uv version: !`uv --version 2>/dev/null || echo "uv not found — install from https://docs.astral.sh/uv"`

## Your Task

Run linters and fix Python/FastAPI code style issues:

$ARGUMENTS

## Linting Commands

### Ruff (Linting + Formatting — Recommended for FastAPI)

```bash
# Check for issues (lint only)
uv run ruff check .

# Auto-fix issues
uv run ruff check . --fix

# Format code (replaces black)
uv run ruff format .

# Check formatting without applying
uv run ruff format . --check

# Specific path
uv run ruff check app/ --fix
uv run ruff format app/
```

### Mypy (Type checking)

```bash
# Type check entire project
uv run mypy app/

# Strict mode (recommended for FastAPI)
uv run mypy app/ --strict

# Ignore missing imports (for third-party libs)
uv run mypy app/ --ignore-missing-imports
```

### Install/Sync dev dependencies

```bash
# Install all deps including dev (ruff, mypy, pytest, etc.)
uv sync

# Add a new dev dependency
uv add --dev ruff mypy pytest pytest-cov httpx
```

## Execution Steps

1. **Detect Config**: Check `pyproject.toml` for `[tool.ruff]`, `[tool.mypy]`, `[tool.black]`
2. **Run Ruff Check**: Identify linting issues first (E, F, I, B, UP rules)
3. **Auto-Fix**: Apply `ruff check --fix` + `ruff format`
4. **Type Check**: Run `mypy app/` for type annotation errors
5. **Report Remaining**: List issues that require manual fixes

## Common FastAPI-Specific Issues

| Issue | Tool | Auto-fix? | Example |
|-------|------|-----------|---------|
| Unused imports | Ruff (F401) | ✅ Yes | `from fastapi import ...` |
| Missing type hints | Mypy | ❌ No | `def get_user(id):` |
| Import order wrong | Ruff (I001) | ✅ Yes | stdlib before third-party |
| f-string not needed | Ruff (F541) | ✅ Yes | `f"hello"` → `"hello"` |
| Deprecated typing | Ruff (UP) | ✅ Yes | `List[str]` → `list[str]` |
| Pydantic v1 patterns | Ruff (PD) | ⚠️ Partial | `.dict()` → `.model_dump()` |

## Output Format

```markdown
## 🔍 Lint Results

### Auto-Fixed Issues
- X files reformatted by ruff
- Import order corrected in X files
- Types of rule violations fixed (e.g., F401, I001)

### Remaining Issues (Manual Fix Required)
| File | Line | Issue | Rule |
|------|------|-------|------|
| app/main.py | 15 | Missing return type annotation | mypy |

### Commands Run
- `uv run ruff check . --fix`
- `uv run ruff format .`
- `uv run mypy app/ --ignore-missing-imports`
```

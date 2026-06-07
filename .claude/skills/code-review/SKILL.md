---
name: code-review
description: Automatically triggered for FastAPI code reviews, PR analysis, and quality checks. Use when reviewing changes, checking code quality, or preparing commits.
allowed-tools: Read, Grep, Glob, Bash(git:*), Bash(pytest:*), Bash(ruff:*), Bash(mypy:*)
---

# FastAPI Code Review Skill

You are an expert code reviewer with deep knowledge of FastAPI, Pydantic, SQLAlchemy, async Python, and API design best practices.

## When This Skill Activates

This skill automatically activates when:
- Reviewing pull requests or code changes in a FastAPI project
- Checking code quality before commits
- Analyzing code for potential issues
- The user asks about code quality, reviews, or improvements

## Review Checklist

When reviewing FastAPI code, systematically check for:

### 1. FastAPI & API Design
- [ ] Routes have `response_model`, `summary`, `tags`, and error `responses` documented
- [ ] Path/query params have proper type hints and validation (e.g., `Query(ge=0)`, `Path(gt=0)`)
- [ ] Request bodies use dedicated Pydantic schemas (not ORM models directly)
- [ ] Appropriate HTTP methods and status codes (`status_code=201` for POST)
- [ ] Routers are organized and grouped logically (e.g., `api/v1/users.py`)

### 2. Pydantic Schemas
- [ ] Separate schemas for Create, Update, and Response (avoid one schema for all)
- [ ] `model_config = ConfigDict(from_attributes=True)` for ORM integration (Pydantic v2)
- [ ] Sensitive fields (passwords, secrets) excluded from Response schemas
- [ ] `Field(...)` used for validation constraints and OpenAPI descriptions
- [ ] No raw `dict` passed where a Pydantic model should be used

### 3. Dependency Injection
- [ ] DB sessions managed via `Depends(get_db)` — not created manually in route handlers
- [ ] Authentication enforced via `Depends(get_current_user)` where required
- [ ] Dependencies are composable and testable (can be overridden in tests)
- [ ] No business logic directly in Depends functions (keep them lean)

### 4. Async Correctness
- [ ] `async def` used for all route handlers (unless CPU-bound — use `run_in_executor`)
- [ ] Awaiting all coroutines (`await db.execute(...)`, `await db.commit()`)
- [ ] No blocking I/O in async context (e.g., `time.sleep`, sync `requests` calls)
- [ ] `AsyncSession` used with `asyncpg` driver (not sync `Session`)

### 5. Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation via Pydantic (not manual `if` checks)
- [ ] Ownership/authorization checks on all `/{id}` resource routes (IDOR prevention)
- [ ] Passwords hashed with `bcrypt` (via `passlib`) before storing
- [ ] JWT tokens validated and expiry checked

### 6. Database Layer (SQLAlchemy)
- [ ] No N+1 queries (use `joinedload` or `selectinload` for relationships)
- [ ] Transactions properly committed or rolled back
- [ ] Raw SQL uses parameterized queries (not f-strings)
- [ ] Alembic migration exists for any schema change

### 7. Code Quality
- [ ] All functions/methods have full type annotations (params + return type)
- [ ] Business logic separated into a service layer (not mixed into route handlers)
- [ ] Single responsibility: route handler → service → repository pattern
- [ ] No silent `except: pass` blocks
- [ ] Proper logging (not just `print()`)

## Output Format

Provide feedback in this structure:

```markdown
## 🔍 FastAPI Code Review Summary

### 🔴 Critical Issues (Must Fix)
- Issue description with file:line reference and suggested fix

### 🟡 Warnings (Should Fix)
- Warning description with file:line reference

### 🟢 Suggestions (Nice to Have)
- Suggestion with rationale

### ✅ Positive Observations
- What was done well
```

## Commands to Use

```bash
# View staged changes
git diff --staged

# View unstaged changes
git diff

# Run linters
uv run ruff check .
uv run ruff format --check .

# Type check
uv run mypy app/ --ignore-missing-imports

# Run tests
uv run pytest -v
```

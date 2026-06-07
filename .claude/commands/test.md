---
description: Run tests with coverage analysis and fix failing tests for FastAPI
argument-hint: [test-pattern] [--coverage] [-v]
allowed-tools: Bash(uv:*), Read, Edit
---

# FastAPI Test Command

## Project Test Configuration

- Test files: !`find . -type d -name ".venv" -prune -o -name "test_*.py" -print | head -15`
- Test config: !`ls -la pytest.ini pyproject.toml conftest.py 2>/dev/null | head -5 || echo "No test config found"`

## Your Task

Based on the arguments provided, execute FastAPI tests and analyze results:

$ARGUMENTS

## Test Commands (Pytest)

```bash
# Standard test run
uv run pytest

# Run with coverage (pytest-cov)
uv run pytest --cov=app --cov-report=term-missing

# Run specific test file
uv run pytest tests/test_main.py

# Run specific test by keyword
uv run pytest -k "test_name"

# Run tests showing print statements and output
uv run pytest -s -v
```

## FastAPI Specific Analysis Steps

1. **Check Dependencies**: Ensure `pytest`, `pytest-cov`, and `httpx` (for AsyncClient) are in `pyproject.toml` dev deps — install with `uv sync`.
2. **Review TestClient**: Check if `fastapi.testclient.TestClient` or `httpx.AsyncClient` is implemented correctly.
3. **Database & Fixtures**: Look for `conftest.py`. Check if database sessions are mocked, overridden, or rolled back cleanly.
4. **Dependency Overrides**: Verify if `app.dependency_overrides` is used effectively for mocking services/DBs.
5. **Environment**: Ensure test-specific environments (`.env.test`) are loaded.
6. **Run Tests**: Execute via `uv run pytest ...`.
7. **Analyze Failures**: Pinpoint issues (e.g., Pydantic validation errors, 422 Unprocessable Entity, async context issues).
8. **Suggest Fixes**: Provide solutions following FastAPI and Pydantic best practices.

## Coverage Guidelines

| Coverage | Rating |
|----------|--------|
| > 90% | Excellent |
| 80-90% | Good |
| 70-80% | Acceptable |
| < 70% | Needs improvement |

## Output Format

```markdown
## 🧪 FastAPI Test Results

### Summary
- Total: X tests
- Passed: ✅ X
- Failed: ❌ X
- Skipped: ⏭️ X

### Failed Tests (if any)
- `test_name`: Description of failure (e.g., FastAPI 422 Validation Error, missing fixture)

### Coverage Report
- Overall: X%
- Uncovered files/lines: ...

### Recommendations & Fixes
- Code snippets to FIX failing tests.
- Suggestions to IMPROVE test architecture (e.g., adding a `pytest.fixture`, overriding a `Depends()`).
```

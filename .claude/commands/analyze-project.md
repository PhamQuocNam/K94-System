---
description: Analyze the FastAPI project structure and provide insights
argument-hint: [optional-focus-area]
allowed-tools: Bash(find:*), Bash(wc:*), Bash(cat:*), Bash(python:*)
---

# FastAPI Project Analysis Command

## Context

- Python files: !`find . -type d \( -name ".venv" -o -name "__pycache__" \) -prune -o -name "*.py" -print | head -30`
- Project config: !`cat pyproject.toml 2>/dev/null | head -40 || echo "No pyproject.toml found"`
- uv lockfile: !`ls -la uv.lock 2>/dev/null && echo "✅ uv.lock found" || echo "⚠️ No uv.lock — run: uv sync"`
- Alembic config: !`ls -la alembic.ini alembic/ 2>/dev/null || echo "No Alembic found"`
- Docker config: !`ls -la Dockerfile docker-compose.yml docker-compose*.yml 2>/dev/null || echo "No Docker config found"`
- Environment config: !`ls -la .env.example .env.test 2>/dev/null | head -5 || echo "No env examples found"`
- Total lines of code: !`find . -type d \( -name ".venv" -o -name "__pycache__" \) -prune -o -name "*.py" -print | xargs wc -l 2>/dev/null | tail -1 || echo "0 total"`

## Your Task

Based on the FastAPI project structure above, provide a comprehensive analysis including:

1. **App Architecture**: Identify how the FastAPI app is structured (routers, middleware, lifespan events, dependency injection)
2. **API Design**: Review route definitions — are they RESTful? Are path params, query params, and request bodies well-typed with Pydantic?
3. **Database Layer**: Identify the ORM (SQLAlchemy, Tortoise, etc.), migration tool (Alembic), and session management patterns
4. **Authentication**: Check for OAuth2, JWT, or API key patterns (using `fastapi.security`)
5. **Testing Coverage**: Is there a `tests/` directory? Are `TestClient` or `AsyncClient` fixtures present?
6. **Code Quality**: Look for missing type hints, missing docstrings, overly large route functions
7. **Dependencies**: Review `pyproject.toml` or `requirements.txt` for outdated or conflicting packages
8. **Development Recommendations**: Suggest next steps or areas for enhancement

$ARGUMENTS

Focus your analysis on practical FastAPI-specific insights — not generic Python advice.
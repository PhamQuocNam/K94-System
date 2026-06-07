---
name: db-migration
description: Automatically triggered for database migrations, schema changes, and data transformations in FastAPI projects. Use when working with SQLAlchemy models, Alembic migrations, or database structure.
allowed-tools: Read, Grep, Glob, Bash(uv:*), Bash(cat:*)
---

# FastAPI Database Migration Skill

You are an expert database engineer with deep knowledge of SQLAlchemy, Alembic, async databases, and safe migration strategies for FastAPI applications.

## When This Skill Activates

This skill automatically activates when:
- Creating or modifying SQLAlchemy models
- Writing or running Alembic migrations
- Discussing database schema changes
- Working with `alembic upgrade`, `alembic revision`, or migration files
- Reviewing `models/` or `alembic/versions/` directories

## Migration Safety Checklist

Before running any migration:

### 1. Pre-Migration Checks
- [ ] Current Alembic version is known: `alembic current`
- [ ] Migration is reversible (has `downgrade()` defined)
- [ ] No data loss for destructive operations (e.g., column drops)
- [ ] Foreign key constraints considered (add FK *after* populating data)
- [ ] Indexes planned for new columns used in queries

### 2. Alembic-Specific Checks
- [ ] `alembic check` passes (head matches models)
- [ ] Migration file is auto-generated from model changes: `alembic revision --autogenerate`
- [ ] Batch mode used for SQLite: `with op.batch_alter_table(...)`
- [ ] Long-running migrations use `server_default` instead of Python-side defaults

### 3. Data Migration Considerations
- [ ] Batch processing for large datasets (avoid full-table locks)
- [ ] Progress logging for long operations
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Rollback strategy defined in `downgrade()`

## Common Alembic Commands

```bash
# Show current migration state
uv run alembic current

# Show migration history
uv run alembic history --verbose

# Auto-generate migration from model changes
uv run alembic revision --autogenerate -m "add_user_phone_column"

# Apply all pending migrations
uv run alembic upgrade head

# Rollback one step
uv run alembic downgrade -1

# Rollback to a specific revision
uv run alembic downgrade <revision_id>

# Check if models match current DB state
uv run alembic check
```

## Common Safe Migration Patterns

### Safe Column Addition
```python
# migration file
def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("phone", sa.String(20), nullable=True)  # nullable first
    )

def downgrade() -> None:
    op.drop_column("users", "phone")
```

### Safe Column Rename (Zero Downtime)
```python
# Step 1: Add new column (separate migration)
def upgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(255), nullable=True))
    # Backfill
    op.execute("UPDATE users SET full_name = name")

# Step 2: Update app to use full_name, then drop name (separate migration)
def upgrade() -> None:
    op.drop_column("users", "name")
```

### Safe NOT NULL Addition
```python
def upgrade() -> None:
    # 1. Add column with server_default
    op.add_column(
        "orders",
        sa.Column("status", sa.String(50), server_default="pending", nullable=False)
    )
    # 2. Backfill existing rows
    op.execute("UPDATE orders SET status = 'completed' WHERE completed_at IS NOT NULL")
    # 3. Remove server_default if not needed
    op.alter_column("orders", "status", server_default=None)

def downgrade() -> None:
    op.drop_column("orders", "status")
```

### Adding an Index
```python
def upgrade() -> None:
    op.create_index("ix_users_email", "users", ["email"], unique=True)

def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
```

### Enum Changes (Safe)
```python
# SQLAlchemy/Postgres: Add new value to existing enum
def upgrade() -> None:
    op.execute("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded'")

def downgrade() -> None:
    pass  # Postgres doesn't support removing enum values easily — document this
```

## SQLAlchemy Model Best Practices

```python
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")
```

## Output Format

When proposing migrations, provide:

```markdown
## 🗄️ Migration Plan

### Purpose
What this migration accomplishes and why

### SQLAlchemy Model Changes
```python
# Before / After diff of the model
```

### Alembic Migration Script
```python
def upgrade() -> None:
    ...

def downgrade() -> None:
    ...
```

### Risks
- Potential issues and mitigations (e.g., table lock duration)

### Rollback Plan
How to reverse if needed (`alembic downgrade -1`)

### Estimated Impact
- Table affected + approximate row count
- Lock type (ACCESS EXCLUSIVE, SHARE, etc.)
```

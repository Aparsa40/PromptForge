# Design Guidelines

This document defines the engineering standards for PromptForge.

---

## Code Organization

- Controllers must not contain database schema definitions.
- Routes must remain thin and delegate to controllers.
- Business logic belongs only in controllers or service layers.
- No logic inside React components beyond UI behavior.

---

## Naming Conventions

Backend:

- Files: camelCase
- Variables: camelCase
- Environment variables: UPPER_SNAKE_CASE

Frontend:

- Components: PascalCase
- CSS Modules: ComponentName.module.css
- Contexts: SomethingContext.jsx

---

## Commit Convention

We follow Conventional Commits:

feat(scope): description
fix(scope): description
docs(scope): description
chore(scope): description

---

## API Response Format

Standard JSON structure:

Success:
{
  "success": true,
  "data": ...
}

Error:
{
  "success": false,
  "message": "Error description"
}

---

## Security Standards

- Never commit .env
- Always validate inputs
- Always sanitize file uploads
- Avoid exposing internal stack traces in production

---

## Database Practices

- Use prepared statements only.
- Avoid raw string interpolation.
- Use soft delete when possible.
- Maintain created_at and updated_at timestamps.

---

## Frontend UX Principles

- Consistent spacing scale
- Accessible contrast ratios
- Responsive layout
- Clear feedback on async operations

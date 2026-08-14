---
inclusion: manual
---

# Git Workflow

## Branch Naming

- Feature: `feature/<short-description>`
- Bugfix: `fix/<short-description>`
- Hotfix: `hotfix/<short-description>`
- Chore: `chore/<short-description>`

## Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:

- `feat(auth): add JWT refresh token flow`
- `fix(quiz): handle empty answers array`
- `chore(deps): update NestJS to v11`

## PR Guidelines

- Keep PRs focused on a single concern
- Include description of what changed and why
- Reference related issues
- Ensure all tests pass before requesting review

# Coding Standards

## TypeScript Guidelines

- Target: ES2023, module resolution: NodeNext
- Enable `emitDecoratorMetadata` and `experimentalDecorators` (required by NestJS)
- Strict null checks are enabled — handle nullability explicitly
- Avoid `any` where possible (lint rule is off, but prefer proper types)
- Use type inference when types are obvious; annotate when they aren't
- Prefer `interface` over `type` for object shapes that can be extended
- Use `enum` sparingly — prefer const objects or union types for simpler cases

## Async Patterns

- Always `await` promises or return them — no floating promises (lint warns on this)
- Use `async/await` over raw Promise chains
- Handle errors with try/catch in services; let controllers propagate NestJS exceptions
- For concurrent independent operations, use `Promise.all()`

## Security Practices

- Validate all input using DTOs with `class-validator`
- Sanitize data before database operations
- Never log sensitive data (passwords, tokens, PII)
- Use environment variables for secrets — never hardcode
- Apply rate limiting on public endpoints
- Use Guards for authentication/authorization

## Database Patterns (when added)

- Use repository pattern for data access
- Create separate entity files for each database table
- Use migrations for schema changes — never auto-sync in production
- Index frequently queried columns
- Use transactions for multi-step operations

## Logging

- Use NestJS built-in `Logger` class
- Create logger per class: `private readonly logger = new Logger(ClassName.name)`
- Log at appropriate levels: error, warn, log, debug, verbose
- Include contextual data in log messages

## Environment Configuration

- Use `@nestjs/config` with `.env` files
- Define a config validation schema (Joi or class-validator)
- Access config through `ConfigService` — never use `process.env` directly in services
- Provide sensible defaults for non-critical config values

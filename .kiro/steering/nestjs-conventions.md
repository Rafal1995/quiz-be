# NestJS Project Conventions

## Project Structure

- Follow NestJS modular architecture: each feature gets its own module directory under `src/`
- Module directory structure:
  ```
  src/<feature>/
  ├── <feature>.module.ts
  ├── <feature>.controller.ts
  ├── <feature>.service.ts
  ├── <feature>.entity.ts (if using TypeORM/Prisma)
  ├── dto/
  │   ├── create-<feature>.dto.ts
  │   └── update-<feature>.dto.ts
  ├── interfaces/
  └── <feature>.controller.spec.ts
  ```
- Shared utilities go in `src/common/` (guards, pipes, interceptors, decorators, filters)
- Configuration lives in `src/config/`

## Naming Conventions

- Files: kebab-case (e.g., `user-profile.service.ts`)
- Classes: PascalCase with suffix indicating type (e.g., `UserProfileService`, `CreateUserDto`)
- Interfaces: PascalCase prefixed with `I` only when needed for disambiguation
- Constants: UPPER_SNAKE_CASE
- DTOs: Use `Create*Dto`, `Update*Dto`, `Query*Dto` naming pattern

## Code Style

- Use single quotes for strings
- Use trailing commas
- Prettier handles formatting — do not fight it
- Prefer `class-validator` decorators for DTO validation
- Prefer `class-transformer` for serialization
- Always type return values on service methods
- Use `readonly` where appropriate on injected dependencies

## Dependency Injection

- Always use constructor injection
- Mark injected services as `private readonly`
- Use custom providers only when necessary (prefer standard injection)

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}
}
```

## API Design

- Use RESTful conventions for endpoints
- Version APIs via URI prefix (`/api/v1/`)
- Use proper HTTP methods and status codes
- Apply validation pipes globally or per-route using DTOs
- Use `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` if Swagger is added

## Error Handling

- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Create custom exceptions extending `HttpException` for domain-specific errors
- Use exception filters for global error formatting
- Never expose internal error details in production responses

## Testing

- Unit tests go alongside source files (`*.spec.ts`)
- E2E tests go in `test/` directory
- Use `@nestjs/testing` for creating test modules
- Mock external dependencies in unit tests
- Run tests with `npm test` (Jest)
- Run e2e with `npm run test:e2e`

## Commands

- Build: `npm run build`
- Dev: `npm run start:dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`
- Test (e2e): `npm run test:e2e`

# AGENTS.md — AI Coding Agent Instructions

This document provides guidelines for AI agents working in this monorepo.

## Project Overview

**better-dx** is a TypeScript monorepo built with Better-T-Stack featuring:
- **apps/web**: React 19 + TanStack Router + Vite (port 3001)
- **apps/server**: Hono + oRPC + Node.js API (port 3000)
- **apps/extension**: WXT browser extension with React
- **apps/tui**: OpenTUI terminal interface
- **packages/api**: Shared type-safe RPC definitions
- **packages/config**: Shared TypeScript configuration

## Build, Lint & Dev Commands

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Development (specific apps)
pnpm dev:web       # Web app only (port 3001)
pnpm dev:server    # Server only (port 3000)

# Build
pnpm build         # Build all apps via Turborepo

# Type checking
pnpm check-types   # TypeScript type check across all packages

# Linting & Formatting (Ultracite/Biome)
pnpm check                    # Check and auto-fix with Biome
pnpm dlx ultracite fix        # Format all files
pnpm dlx ultracite check      # Check without fixing
pnpm dlx ultracite doctor     # Diagnose setup issues
```

## Testing

**No test framework currently configured.** The pre-commit hook expects `pnpm test` but no tests exist yet.

When tests are added, they should follow these conventions:
- Use Vitest (recommended for Vite projects)
- Write assertions inside `it()` or `test()` blocks
- Use async/await, not done callbacks
- Never commit `.only` or `.skip`
- Keep test suites flat (avoid nested `describe`)

```bash
# Future single test command (once configured)
pnpm test -- path/to/file.test.ts
```

## Code Style Guidelines

This project uses **Ultracite** (Biome preset) for automated formatting/linting.

### TypeScript & Types

- **Strict mode enabled** with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- Use explicit types for function parameters and return values
- Prefer `unknown` over `any` — never suppress with `@ts-ignore` or `as any`
- Use const assertions (`as const`) for immutable values
- Leverage type narrowing instead of type assertions
- Use `type` imports for types only: `import type { Foo } from "..."`

### Imports

```typescript
// Type-only imports first
import type { Context } from "hono";
import type { QueryClient } from "@tanstack/react-query";

// External packages
import { Hono } from "hono";
import { useQuery } from "@tanstack/react-query";

// Internal packages (workspace)
import { appRouter } from "@better-dx/api/routers/index";

// Relative imports with @ alias
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

**Path aliases:**
- Web app: `@/` → `apps/web/src/`
- Extension: `@/` → `apps/extension/`

### Naming Conventions

- **Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Components**: `PascalCase` (function name matches export)
- **Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` otherwise
- **Types/Interfaces**: `PascalCase`

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` over `.forEach()` and indexed loops
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use template literals over string concatenation
- Use destructuring for object/array assignments
- Use `const` by default, `let` only when reassignment needed, never `var`

### Async & Promises

- Always `await` promises in async functions
- Use `async/await` over promise chains
- Handle errors with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components, not class components
- Call hooks at top level only, never conditionally
- Specify all dependencies in hook dependency arrays
- Use `key` prop for iterables (prefer unique IDs over indices)
- Nest children between tags, not as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility

### Error Handling

- Throw `Error` objects with descriptive messages, not strings
- Use try-catch meaningfully — don't catch just to rethrow
- Prefer early returns over nested conditionals
- Remove `console.log`, `debugger`, `alert` from production code

### Performance

- Avoid spread syntax in loop accumulators
- Use top-level regex literals, not in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index re-exports)

## Project-Specific Patterns

### oRPC (Type-Safe API)

```typescript
// packages/api/src/routers/index.ts - Define procedures
import { publicProcedure } from "../index";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

// apps/web/src/utils/orpc.ts - Client setup
export const client: AppRouterClient = createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);

// Usage in components
const healthCheck = useQuery(orpc.healthCheck.queryOptions());
```

### TanStack Router (File-Based Routing)

```typescript
// apps/web/src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() { /* ... */ }
```

Routes are auto-generated in `routeTree.gen.ts` — don't edit manually.

### UI Components (shadcn/ui + Base UI)

```typescript
// Use cn() for conditional classes
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />

// Button variants with class-variance-authority
<Button variant="outline" size="sm">Click</Button>
```

### Environment Variables

- **Server**: Use `dotenv/config` import, access via `process.env.VAR`
- **Web**: Prefix with `VITE_`, access via `import.meta.env.VITE_VAR`
- Copy `.env.example` to `.env` in each app that needs it

## Pre-Commit Hook

The pre-commit hook automatically:
1. Runs `pnpm test` (currently no tests)
2. Formats staged files with Ultracite
3. Re-stages formatted files

## Security

- Add `rel="noopener"` with `target="_blank"` links
- Avoid `dangerouslySetInnerHTML`
- Don't use `eval()` or assign to `document.cookie`
- Validate and sanitize user input

## Common Gotchas

1. **Port conflicts**: Web runs on 3001, Server on 3000
2. **routeTree.gen.ts**: Auto-generated, don't edit
3. **Catalog dependencies**: Shared versions in `pnpm-workspace.yaml`
4. **No tests yet**: Pre-commit expects tests but none exist
5. **Biome ignores**: Check `biome.json` for excluded paths

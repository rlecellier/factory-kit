# Factory Kit Test Project - ESM with Vitest

This is a test project for the `factory-kit` library using:

- **ESM modules** (`"type": "module"`)
- **TypeScript** for type safety
- **Vitest** as the test runner (instead of Jest)
- **@faker-js/faker** for generating test data

## Available Scripts

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run build` - Compile TypeScript
- `npm run check` - Type check without emitting files

## Key Differences from Jest Version

- Uses `vitest` instead of `jest`
- Uses `vitest.config.ts` instead of `jest.config.ts`
- Imports test functions from `vitest`: `import { describe, it, expect } from 'vitest'`
- No need for complex ESM configuration as Vitest has built-in ESM support

## Test Coverage

The test suite covers all major factory-kit features:

- Basic factory creation and building
- Traits and trait application
- Attribute overrides
- Unique value generation
- Sequence generation
- Building multiple objects with `buildMany`

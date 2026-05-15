# Implementation Plan: Mobile Monorepo Merger

## Overview

This plan converts the `apps/mobile` workspace from a Next.js + Prisma web app into a pure Expo + React Native client within the LibLog NPM Workspaces monorepo. The implementation follows the strict merger sequence: workspace repair → dependency isolation → backend purge → Expo scaffold → branding token mapping → documentation rewrite → audit report → build verification. All code uses TypeScript with vitest + fast-check for testing.

## Tasks

- [x] 1. Repair root workspace declaration and set up project infrastructure
  - [x] 1.1 Update root `package.json` workspaces field to `["apps/*", "packages/*"]` and add `dev:mobile` script
    - Change `workspaces` from explicit paths to glob pattern `["apps/*", "packages/*"]`
    - Ensure `private: true` is set
    - Add script `"dev:mobile": "npm run start --workspace=apps/mobile"`
    - Preserve existing desktop scripts (`dev:desktop`, `build:desktop`)
    - _Requirements: 1.1, 1.2, 1.7_

  - [x] 1.2 Create the SSoT violation scanner utility at `tests/utils/ssot-scanner.ts`
    - Implement `SSOTViolation` and `ScanResult` interfaces from design
    - Implement recursive file scanning for `.ts`, `.tsx`, `.js`, `.jsx` files
    - Detect Route Handler exports (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`) from API paths
    - Detect forbidden imports (`next/server`, `next-auth`, `@prisma/client`, `prisma`)
    - Detect HTTP server instantiation (Express, Fastify, Hono patterns)
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 1.3 Create the dependency isolation checker utility at `tests/utils/dependency-checker.ts`
    - Implement forbidden dependency sets for root, desktop, and mobile manifests
    - Check all dependency fields (`dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`)
    - Return violation records with package name, field name, and manifest path
    - Use exact package name matching (not substring)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.4 Create the file categorizer utility at `tests/utils/file-categorizer.ts`
    - Implement categorization logic for: API Routes, Next.js Configs, Prisma Directory, Databases, Build Artifacts, PostCSS Configs
    - Each file assigned to exactly one category based on path pattern
    - Return categorized file lists for audit report generation
    - _Requirements: 3.7, 11.3_

  - [x] 1.5 Set up vitest configuration and test infrastructure at project root
    - Create `vitest.config.ts` with paths for `tests/pbt/` and `tests/unit/`
    - Add `fast-check` and `vitest` as devDependencies in root or appropriate workspace
    - Configure TypeScript paths for test utilities
    - _Requirements: (testing infrastructure)_

- [x] 2. Implement property-based tests for core utilities
  - [x] 2.1 Write property test for dependency isolation detection at `tests/pbt/dependency-isolation.test.ts`
    - **Property 1: Dependency Isolation Detection**
    - Generate random manifest objects with injected forbidden dependencies
    - Verify checker flags every forbidden package with correct field and path
    - Minimum 100 iterations
    - **Validates: Requirements 2.4, 2.5**

  - [x] 2.2 Write property test for SSoT violation detection at `tests/pbt/ssot-scanner.test.ts`
    - **Property 2: SSoT Violation Detection**
    - Generate random TypeScript file contents with forbidden patterns (route handlers, imports, HTTP servers)
    - Verify scanner classifies each file as a violation with correct file path and pattern
    - Minimum 100 iterations
    - **Validates: Requirements 5.1, 5.2, 5.6**

  - [x] 2.3 Write property test for violation report completeness at `tests/pbt/report-completeness.test.ts`
    - **Property 3: Violation Report Completeness**
    - Generate random sets of SSoT violation objects
    - Verify audit report generator includes every violation in output
    - Assert count equality between input violations and report entries
    - Minimum 100 iterations
    - **Validates: Requirements 5.3, 5.4**

  - [x] 2.4 Write property test for file categorization correctness at `tests/pbt/file-categorizer.test.ts`
    - **Property 4: File Categorization Correctness**
    - Generate random file paths matching legacy artifact patterns
    - Verify each file is assigned to exactly one category
    - Verify every file appears in the report under its correct category
    - Minimum 100 iterations
    - **Validates: Requirements 3.7**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Execute backend purge on `apps/mobile`
  - [x] 4.1 Run SSoT violation scan on current `apps/mobile` and record results
    - Execute scanner against `apps/mobile/src/app/api/**` and all source files
    - Record all violations for inclusion in Migration Audit Report
    - Store scan results for use in audit report generation (task 8)
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [x] 4.2 Delete all legacy backend artifacts from `apps/mobile`
    - Remove `src/app/api/` directory and all contents
    - Remove `next.config.ts`, `next.config.js`, `next.config.mjs` if present
    - Remove `prisma/` directory if present
    - Remove all `.db`, `.sqlite`, `.sqlite3` files
    - Remove `app-paths-manifest.json`
    - Remove `postcss.config.mjs`
    - Record every removed file path (relative to `apps/mobile/`) categorized by type
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.3 Rewrite `apps/mobile/package.json` to remove legacy dependencies and add Expo/RN dependencies
    - Remove all Legacy_Web_Framework_Dependencies (`next`, `next-auth`, `prisma`, `@prisma/client`, `@radix-ui/*`, `react-dom`, etc.)
    - Remove web-only packages (`sharp`, `embla-carousel-react`, `cmdk`, `vaul`, `sonner`, `@mdxeditor/editor`, `@dnd-kit/*`, etc.)
    - Add Mobile_Specific_Dependencies (`expo`, `react-native`, `expo-router`, `nativewind`, `react-native-reanimated`, etc.)
    - Retain cross-platform deps (`react`, `zod`, `zustand`, `@tanstack/react-query`, `date-fns`, `react-hook-form`)
    - Set `name` to `liblog-mobile`, `main` to `expo-router/entry`
    - Set scripts: `start`, `android`, `ios`, `lint`
    - Remove any script beginning with `next ` or `prisma `
    - _Requirements: 2.3, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 5. Scaffold Expo + React Native project structure
  - [x] 5.1 Create Expo Router file-based route structure under `apps/mobile/app/`
    - Create `app/_layout.tsx` (root layout with NativeWind provider)
    - Create `app/(tabs)/_layout.tsx` (tab navigator)
    - Create `app/(tabs)/index.tsx` (Home screen)
    - Create `app/(tabs)/search.tsx` (Catalog screen)
    - Create `app/(tabs)/scan.tsx` (QR Scanner screen)
    - Create `app/(tabs)/borrowed.tsx` (My Loans screen)
    - Create `app/(tabs)/profile.tsx` (Profile screen)
    - Create `app/+not-found.tsx`
    - _Requirements: 4.3, 4.6_

  - [x] 5.2 Create core service and store files under `apps/mobile/src/`
    - Create `src/services/supabase.ts` mirroring desktop pattern with Expo Constants for env vars
    - Create `src/store/authStore.ts` using Zustand (same pattern as desktop)
    - Create `src/types/` directory with placeholder type definitions
    - Create `src/components/` directory structure
    - _Requirements: 5.5_

  - [x] 5.3 Create Expo configuration files at `apps/mobile/`
    - Create `app.json` with Expo config (name, slug, scheme, platforms)
    - Create `babel.config.js` with NativeWind preset
    - Create `metro.config.js` for NativeWind v4 Metro bundler support
    - Create `tsconfig.json` for the mobile workspace
    - _Requirements: 4.1, 4.2, 4.6_

- [x] 6. Map branding tokens to NativeWind v4 configuration
  - [x] 6.1 Create `apps/mobile/tailwind.config.ts` with LibLog branding tokens
    - Define `lib-purple` DEFAULT as `#652D90`
    - Define full Lib_Purple_Palette (50 through 900) with exact hex values from Branding_Doc
    - Define semantic tokens (`background`, `foreground`, `card`, `primary`, `destructive`, `border`, `input`, `ring`)
    - Define border radius tokens (`3xl: 24px`, `2xl: 16px`, `xl: 12px`)
    - Set `darkMode: "class"` and content paths
    - _Requirements: 6.1, 6.2, 6.7, 7.1, 7.2, 7.3_

  - [x] 6.2 Create `apps/mobile/global.css` with CSS variables for light and dark mode
    - Define `:root` variables: `--background: #f2f2fa`, `--foreground: #1a1a1a`, `--card: #ffffff`, `--primary: #652d90`, `--primary-foreground: #ffffff`, `--border: #e8d5f3`, `--input: #e8d5f3`
    - Define `.dark` variables: `--background: #110a1e`, `--card: oklch(0.18 0.05 300)`, etc.
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 6.3 Write unit tests for branding token values at `tests/unit/branding-tokens.test.ts`
    - Verify all 10 Lib_Purple_Palette shades match expected hex values
    - Verify `--background` light/dark values
    - Verify `--primary` and `--primary-foreground` values
    - Verify border radius tokens
    - _Requirements: 6.1, 6.2, 6.3, 6.7_

- [x] 7. Rewrite documentation files
  - [x] 7.1 Rewrite `apps/mobile/OVERVIEW.md` to reflect Mobile_App subordinate role
    - Include `## Architectural Stance` heading citing `.kiro/steering/desktop_architecture_ssot.md`
    - Declare platform as "Expo plus React Native" within first 50 lines
    - Declare backend as "Supabase (PostgreSQL, Auth, Realtime)" shared with Desktop
    - Use exact phrase "data-collection client" for role declaration
    - Declare monorepo position as `apps/mobile` via `apps/*`
    - List tech stack (Expo, RN, NativeWind, Supabase, Zustand)
    - Include screen inventory (client screens only)
    - Exclude all references to Next.js, Prisma, SQLite, NextAuth, next-themes, next-intl
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 7.2 Rewrite `apps/mobile/FEATURES.md` with canonical feature table
    - Write introduction using exact phrases "data-collection client" and "administrative engine"
    - Create table with columns: `Mobile Feature`, `Desktop_Counterpart`, `Direction of Data Flow`, `Notes`
    - Map QR Scanner → Live Monitor (Mobile → Desktop)
    - Map Penalty View (Read-Only) → Circulation Engine (Desktop → Mobile) with payment note
    - Map Catalog → Books Manager (Desktop → Mobile)
    - Map Patron Login → Authentication Engine (Bidirectional)
    - Map Reservations → Circulation Engine (Mobile → Desktop)
    - Map Attendance History → Live Monitor / `/attendance` (Desktop → Mobile)
    - Minimum 6 rows, restrict Direction to `Mobile → Desktop`, `Desktop → Mobile`, or `Bidirectional`
    - Exclude all API endpoint tables, Prisma models, NextAuth/Next.js/SQLite references
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12_

  - [x] 7.3 Write unit tests for documentation content at `tests/unit/documentation.test.ts`
    - Verify OVERVIEW.md contains required headings and phrases, excludes forbidden terms
    - Verify FEATURES.md has correct columns, minimum 6 rows, valid direction values
    - Verify no legacy section headers remain
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 10.1, 10.8, 10.10, 10.11, 10.12_

- [x] 8. Generate Migration Audit Report
  - [x] 8.1 Create `apps/mobile/MIGRATION_AUDIT.md` with all required sections
    - `Files Removed` — list every purged file path relative to `apps/mobile/`, categorized per Requirement 3
    - `Dependencies Removed` — one package name per line
    - `Dependencies Added` — one package name per line
    - `Branding Tokens Mapped` — each Lib_Purple_Palette token with hex value
    - `Documentation Rewritten` — byte size and SHA-256 hash of OVERVIEW.md and FEATURES.md
    - `Outstanding SSoT Violations` — entries from scan or literal `None`
    - `Dependency Isolation Violations` — entries or literal `None`
    - `Documentation Violations` — entries or literal `None`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [x] 8.2 Write unit tests for audit report structure at `tests/unit/audit-report.test.ts`
    - Verify all required sections are present
    - Verify file paths are relative to `apps/mobile/`
    - Verify format compliance (one entry per line, correct section titles)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Verify build compatibility
  - [x] 10.1 Run `npm install` at workspace root and verify both workspaces are recognized
    - Execute `npm install` — expect exit code 0 within 120 seconds
    - Execute `npm ls --workspaces` — expect both `liblog-mobile` and `liblog-desktop` listed
    - Record any install failures in MIGRATION_AUDIT.md under `Install Failures`
    - _Requirements: 1.3, 1.5, 1.6, 1.7_

  - [x] 10.2 Run dependency isolation check post-install and update audit report
    - Execute dependency checker against root, desktop, and mobile manifests
    - Verify no Mobile_Specific_Dependencies in root or desktop
    - Verify no Legacy_Web_Framework_Dependencies in mobile
    - Record any violations in MIGRATION_AUDIT.md under `Dependency Isolation Violations`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 10.3 Verify desktop dev server starts successfully and append build status to audit report
    - Run `npm run dev:desktop` and verify Vite binds to port 5173 within 15 seconds
    - Verify no error-level output referencing `apps/mobile` in stderr
    - Record any startup failures in MIGRATION_AUDIT.md
    - Append `Build Compatibility: PASSED` or `FAILED` to audit report
    - _Requirements: 12.1, 12.3, 12.4_

  - [x] 10.4 Verify mobile Expo server starts successfully and finalize audit report
    - Run mobile start script and verify Expo initializes within 15 seconds
    - Record any startup failures in MIGRATION_AUDIT.md under `Startup Failures`
    - Finalize `Build Compatibility` status in audit report
    - _Requirements: 12.2, 12.3, 12.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific configuration values and document content
- The merger sequence is strict: workspace repair → purge → scaffold → branding → docs → audit → verify
- All tests use `vitest` with `fast-check` for property-based testing
- TypeScript is used throughout (matching the design document's code examples)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 6, "tasks": ["6.1", "6.2"] },
    { "id": 7, "tasks": ["6.3", "7.1", "7.2"] },
    { "id": 8, "tasks": ["7.3", "8.1"] },
    { "id": 9, "tasks": ["8.2", "10.1"] },
    { "id": 10, "tasks": ["10.2"] },
    { "id": 11, "tasks": ["10.3", "10.4"] }
  ]
}
```

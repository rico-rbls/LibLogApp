# Requirements Document

## Introduction

The LibLog mobile codebase has been physically dropped into `apps/mobile` of the LibLog NPM Workspaces monorepo. As delivered, it is a Next.js 16 + Prisma + SQLite + NextAuth web application with full backend route handlers under `src/app/api/`. This violates the Desktop Architecture Single Source of Truth (SSoT), which mandates that the Mobile_App is "merely a React Native data-collection client" with "no backend logic permitted."

This feature integrates `apps/mobile` into the monorepo by (1) repairing the root workspace declaration, (2) preventing dependency cross-contamination between Mobile and Desktop, (3) purging legacy backend artifacts that conflict with a pure Expo + React Native client, (4) enforcing the desktop branding tokens (Lib Purple `#652D90`, flat light mode, `rounded-3xl` cards) on the mobile UI, and (5) rewriting `apps/mobile/OVERVIEW.md` and `apps/mobile/FEATURES.md` to reflect the Mobile_App's subordinate role and explicit feature parity with the Desktop_App.

The deliverable is a workspace where the Desktop_App remains the SSoT and the Mobile_App is a thin client that mirrors desktop branding and consumes the same Supabase backend.

## Glossary

- **Workspace_Root**: The repository root `c:\LibLogKiro\LibLogApp` containing the root `package.json` with the `workspaces` field.
- **Workspace_Root_Manifest**: The `package.json` file located at the Workspace_Root.
- **Desktop_Workspace**: The directory `apps/desktop/liblog-desktop` and its `package.json` (`liblog-desktop`).
- **Desktop_Workspace_Manifest**: The `package.json` file at `apps/desktop/liblog-desktop/package.json`.
- **Mobile_Workspace**: The directory `apps/mobile` and its `package.json`.
- **Mobile_Workspace_Manifest**: The `package.json` file at `apps/mobile/package.json`.
- **Desktop_App**: The Vite + React 19 + TypeScript + Tailwind CSS v4 administrative dashboard built from the Desktop_Workspace, consuming Supabase as its backend.
- **Mobile_App**: The Expo + React Native client to be built from the Mobile_Workspace after this merger completes.
- **SSoT_Doc**: The steering file at `.kiro/steering/desktop_architecture_ssot.md` declaring the Desktop_App as the Single Source of Truth and prohibiting backend logic in the Mobile_App.
- **Branding_Doc**: The steering file at `.kiro/steering/branding.md` defining typography, colors, corner radii, shadow rules, and component tokens.
- **Lib_Purple**: The brand color with hex value `#652D90`, defined in Branding_Doc Section 2 as "Lib Purple" (RGB 101, 45, 144).
- **Lib_Purple_Palette**: The ten-shade palette `lib-purple-50` (`#F5EDF9`), `lib-purple-100` (`#E8D5F3`), `lib-purple-200` (`#D4ADE7`), `lib-purple-300` (`#B87DD4`), `lib-purple-400` (`#9B5BBF`), `lib-purple-500` (`#652D90`), `lib-purple-600` (`#5A2880`), `lib-purple-700` (`#4A2068`), `lib-purple-800` (`#3A1850`), `lib-purple-900` (`#2A1038`) defined in Branding_Doc Section 2.
- **Mobile_Specific_Dependencies**: NPM packages whose runtime is the Expo / React Native platform, including but not limited to `expo`, `expo-*` (e.g. `expo-router`, `expo-status-bar`), `react-native`, and `@react-native/*`.
- **Legacy_Backend_Artifacts**: Files and directories inside the Mobile_Workspace whose presence implies server-side execution within mobile, including any directory matching `src/app/api/**`, `next.config.ts`, `next.config.js`, `next.config.mjs`, `prisma/` (the Prisma schema and migrations directory), and any file with extension `.db`, `.sqlite`, or `.sqlite3`.
- **Legacy_Web_Framework_Dependencies**: NPM packages bound to the Next.js / Prisma stack, including `next`, `next-auth`, `next-intl`, `next-themes`, `eslint-config-next`, `prisma`, `@prisma/client`, `bun-types`, and any package whose name begins with `next/`.
- **Mobile_OVERVIEW**: The file at `apps/mobile/OVERVIEW.md`.
- **Mobile_FEATURES**: The file at `apps/mobile/FEATURES.md`.
- **Mobile_App_Tailwind_Config**: The Tailwind configuration consumed by the Mobile_App build (currently `apps/mobile/tailwind.config.ts` and any companion `globals.css` or theme file used for token resolution; on migration to Expo + NativeWind v4 this becomes the equivalent NativeWind/Tailwind config).
- **Content_Surface_Card**: A top-level UI surface in the Mobile_App that holds a section of content (analogous to a `bg-card rounded-3xl p-4` element on the Desktop_App).
- **Migration_Audit_Report**: A markdown record produced by the merger tasks, located at `apps/mobile/MIGRATION_AUDIT.md`, listing every artifact removed and every dependency added or removed.
- **Desktop_Counterpart**: A named module of the Desktop_App (such as Live Monitor, Books Manager, Patron Manager, Circulation Engine, Overdue Dashboard, Report Generator, Authentication Engine) as enumerated in `.kiro/steering/OVERVIEW.md` Section "Delivered Modules" and "Desktop Implementation Status".

## Requirements

### Requirement 1: Root Workspace Declaration Integrity

**User Story:** As the Lead Programmer, I want the root `package.json` to declare a single coherent workspace pattern, so that both `apps/desktop` and `apps/mobile` are recognized as workspaces and `npm install` resolves a single hoisted tree.

#### Acceptance Criteria

1. THE Workspace_Root_Manifest SHALL declare the `workspaces` field with the exact value `["apps/*", "packages/*"]`.
2. THE Workspace_Root_Manifest SHALL declare the `private` field with the value `true`.
3. WHEN `npm install` is executed at the Workspace_Root, THE Workspace_Root SHALL exit with status code `0` within 120 seconds.
4. IF `npm install` is executed at the Workspace_Root and the `private` field of the Workspace_Root_Manifest is missing or does not equal `true`, THEN THE Workspace_Root SHALL exit with a non-zero status code and the merger task SHALL be reported as failed.
5. WHEN `npm install` completes successfully at the Workspace_Root, THE Workspace_Root SHALL produce a `node_modules` tree in which every dependency declared in the Mobile_Workspace_Manifest and every dependency declared in the Desktop_Workspace_Manifest is resolvable by its owning workspace (verified by `npm ls --workspaces` exiting with status code `0` and listing zero unmet dependencies).
6. IF `npm install` exits with a non-zero status code for any reason (including partial dependency resolution failure in either workspace), THEN the merger task SHALL be reported as failed and the Migration_Audit_Report SHALL record the failing command, its exit code, and the first 20 lines of stderr under a section titled `Install Failures`.
7. WHEN `npm ls --workspaces` is executed at the Workspace_Root after a successful `npm install`, THE output SHALL list both the Mobile_Workspace package name and the Desktop_Workspace package name as recognized workspaces.

### Requirement 2: Cross-Workspace Dependency Isolation

**User Story:** As the Lead Programmer, I want mobile-specific and web-specific dependencies to remain inside their owning workspace, so that adding the mobile codebase does not pollute the desktop build graph or the workspace root.

#### Acceptance Criteria

1. THE Workspace_Root_Manifest SHALL exclude every Mobile_Specific_Dependency from its `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies` fields.
2. THE Desktop_Workspace_Manifest SHALL exclude every Mobile_Specific_Dependency from its `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies` fields.
3. THE Mobile_Workspace_Manifest SHALL exclude every Legacy_Web_Framework_Dependency from its `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies` fields.
4. IF a Mobile_Specific_Dependency is present in any dependency field (`dependencies`, `devDependencies`, `peerDependencies`, or `optionalDependencies`) of either the Workspace_Root_Manifest or the Desktop_Workspace_Manifest at the moment the merger tasks complete, THEN THE Migration_Audit_Report SHALL flag the offending package name, the dependency field name, and the file path of the manifest as a "DEPENDENCY LEAK" violation.
5. IF a Legacy_Web_Framework_Dependency is present in any dependency field (`dependencies`, `devDependencies`, `peerDependencies`, or `optionalDependencies`) of the Mobile_Workspace_Manifest at the moment the merger tasks complete, THEN THE Migration_Audit_Report SHALL flag the offending package name and the dependency field name as a "LEGACY DEPENDENCY" violation.
6. IF one or more "DEPENDENCY LEAK" or "LEGACY DEPENDENCY" violations are recorded in the Migration_Audit_Report, THEN THE merger SHALL be reported as failed and no subsequent merger task SHALL be marked complete until every flagged violation is resolved.

### Requirement 3: Mobile Workspace Backend Purge

**User Story:** As the Lead Programmer enforcing the Desktop SSoT, I want all server-side routing, ORM scaffolding, and bundled databases removed from `apps/mobile`, so that the Mobile_Workspace contains only client code consistent with a pure React Native Expo architecture.

#### Acceptance Criteria

1. WHEN the merger tasks complete, THE Mobile_Workspace SHALL NOT contain any directory or file at any depth matching the glob `src/app/api/**`.
2. WHEN the merger tasks complete, THE Mobile_Workspace SHALL NOT contain any file named `next.config.ts`, `next.config.js`, or `next.config.mjs` at any depth.
3. WHEN the merger tasks complete, THE Mobile_Workspace SHALL NOT contain any directory named `prisma` at any depth.
4. WHEN the merger tasks complete, THE Mobile_Workspace SHALL NOT contain any file whose extension is `.db`, `.sqlite`, or `.sqlite3` at any depth.
5. WHEN the merger tasks complete, THE Mobile_Workspace SHALL NOT contain any file named `app-paths-manifest.json` (a Next.js build artifact) at any depth.
6. WHEN the merger tasks complete, THE Mobile_Workspace SHALL NOT contain any file named `postcss.config.mjs` (Tailwind on RN does not require PostCSS pipeline) at any depth.
7. WHEN the Mobile_Workspace is recursively scanned during the purge, THE Migration_Audit_Report SHALL list every file path removed under each of the categories defined in criteria 1 through 6, with one file path per line expressed relative to the Mobile_Workspace root. IF a category yields zero matches, THE Migration_Audit_Report SHALL list that category with the literal text `(none found)`.

### Requirement 4: Mobile_App Runtime Declaration

**User Story:** As the Lead Programmer, I want the Mobile_Workspace_Manifest to declare an Expo + React Native runtime, so that the integration target is unambiguous and consistent with the SSoT.

#### Acceptance Criteria

1. THE Mobile_Workspace_Manifest SHALL declare `expo` as a runtime dependency in its `dependencies` field with a non-empty semver-compatible version range.
2. THE Mobile_Workspace_Manifest SHALL declare `react-native` as a runtime dependency in its `dependencies` field with a non-empty semver-compatible version range.
3. THE Mobile_Workspace_Manifest SHALL declare a `start` script whose command string contains the substring `expo start` (with or without a preceding `npx ` prefix).
4. THE Mobile_Workspace_Manifest SHALL declare its `name` field with a value that is a valid npm package name (lowercase, no spaces, no uppercase letters) and that does not contain the substring `nextjs`.
5. THE Mobile_Workspace_Manifest SHALL omit any script whose command begins with `next ` or `prisma `.
6. THE Mobile_Workspace_Manifest SHALL declare a `main` entry point field whose value references an Expo-compatible entry module (such as `expo-router/entry` or `node_modules/expo/AppEntry.js`).

### Requirement 5: Desktop SSoT Enforcement in Mobile Source

**User Story:** As the Lead Programmer enforcing the SSoT, I want continuous evidence that the Mobile_Workspace contains no backend logic, so that the Mobile_App remains a thin data-collection client at all times after this merger.

#### Acceptance Criteria

1. THE Mobile_Workspace SHALL exclude any file with extension `.ts`, `.tsx`, `.js`, or `.jsx` that exports a Next.js Route Handler symbol (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, or `OPTIONS`) from a path matching `src/app/api/**` or `app/api/**`.
2. THE Mobile_Workspace SHALL exclude any file with extension `.ts`, `.tsx`, `.js`, or `.jsx` that contains an import statement resolving to the modules `next/server`, `next-auth`, `@prisma/client`, or `prisma`.
3. WHEN the merger scan processes the Mobile_Workspace prior to file removal, IF a source file with extension `.ts`, `.tsx`, `.js`, or `.jsx` imports from any module listed in criterion 2, THEN THE Migration_Audit_Report SHALL record the file path and the offending import specifier as a "SSoT VIOLATION" entry before the file is removed.
4. IF the merger process detects one or more SSoT violations during the scan but the Migration_Audit_Report does not contain a corresponding "SSoT VIOLATION" entry for every detected violation at the moment the merger tasks complete, THEN the merger SHALL be reported as failed and no subsequent merger task SHALL be marked complete until every detected violation is successfully recorded in the Migration_Audit_Report.
5. THE Mobile_App SHALL consume Supabase backend services exclusively through the `@supabase/supabase-js` client library, configured with the same Supabase project URL and anon key values used by the Desktop_App (as declared in the Desktop_Workspace environment configuration).
6. THE Mobile_Workspace SHALL NOT contain any source file with extension `.ts`, `.tsx`, `.js`, or `.jsx` that directly instantiates an HTTP server, defines an Express/Fastify/Hono route, or invokes `next()` middleware — any such file SHALL be treated as a SSoT violation under criterion 3.

### Requirement 6: Branding Color Token Mapping

**User Story:** As a patron using the Mobile_App, I want the visual identity to be indistinguishable from the Desktop_App dashboard, so that the two products feel like one continuous LibLog system.

#### Acceptance Criteria

1. THE Mobile_App_Tailwind_Config SHALL define a token named `lib-purple` whose value equals the hex string `#652D90`.
2. THE Mobile_App_Tailwind_Config SHALL define each token in the Lib_Purple_Palette using the exact hex values listed in the Glossary entry for Lib_Purple_Palette, producing the classes `bg-lib-purple-50` through `bg-lib-purple-900` (10 tokens total).
3. THE Mobile_App_Tailwind_Config SHALL define a token named `--background` (or its NativeWind equivalent) whose light-mode value equals the hex string `#f2f2fa` and whose dark-mode value equals the hex string `#110a1e`.
4. THE Mobile_App_Tailwind_Config SHALL define a token named `--card` (or its NativeWind equivalent) whose light-mode value equals the hex string `#FFFFFF` and whose dark-mode value produces a dark purple surface distinguishable from the `--background` dark-mode value.
5. WHERE the Mobile_App renders text on a background whose color is any Lib_Purple_Palette shade from `lib-purple-500` (`#652D90`) through `lib-purple-900` (`#2A1038`), THE Mobile_App SHALL use the foreground color `#FFFFFF`.
6. WHERE the Mobile_App renders text on a background whose color is any Lib_Purple_Palette shade from `lib-purple-50` (`#F5EDF9`) through `lib-purple-400` (`#9B5BBF`), THE Mobile_App SHALL use a foreground color that achieves a minimum WCAG AA contrast ratio of 4.5:1 against that background.
7. THE Mobile_App_Tailwind_Config SHALL define a token named `--primary` (or its NativeWind equivalent) whose value equals the hex string `#652D90` and a token named `--primary-foreground` whose value equals the hex string `#FFFFFF`.

### Requirement 7: Branding Geometry — Corner Radii

**User Story:** As a patron using the Mobile_App, I want surface geometry (rounded card corners) to match the Desktop_App, so that visual cadence is identical across devices.

#### Acceptance Criteria

1. THE Mobile_App SHALL render every Content_Surface_Card with a corner radius of 24 logical pixels with a tolerance of plus or minus 2 logical pixels (the `rounded-3xl` token from Branding_Doc Section 3).
2. THE Mobile_App SHALL render inner card elements (book covers, embedded panels, modal bodies) with a corner radius of 16 logical pixels with a tolerance of plus or minus 2 logical pixels (the `rounded-2xl` token from Branding_Doc Section 3).
3. THE Mobile_App SHALL render primary buttons, secondary buttons, text inputs, and icon containers with a corner radius of 12 logical pixels with a tolerance of plus or minus 2 logical pixels (the `rounded-xl` token from Branding_Doc Section 3).
4. THE Mobile_App SHALL render avatars and pill badges with a fully rounded corner radius (50 percent of the shorter axis).
5. THE Mobile_App SHALL clip all child content (images, gradients, colored backgrounds) to the corner radius of its parent container so that no content visually overflows the rounded boundary.
6. THE Mobile_App SHALL render bottom sheets with a corner radius of 24 logical pixels with a tolerance of plus or minus 2 logical pixels applied to the top-left and top-right corners only, with 0 pixels on the bottom corners.

### Requirement 8: Branding Elevation — Flat Light Mode

**User Story:** As a patron using the Mobile_App in light mode, I want the same flat surface system as the Desktop_App, so that there is no shadow drift between the two products.

#### Acceptance Criteria

1. WHILE the Mobile_App is rendered in light mode, THE Mobile_App SHALL render every Content_Surface_Card (defined as any component using the Standard, Spacious, Interactive, or Stat card variants from Branding_Doc Section 12) with no drop shadow and no box-shadow CSS property other than `none`.
2. WHILE the Mobile_App is rendered in light mode AND the primary button is not contained within the bottom navigation bar AND the primary button is not the QR scan center action, THE Mobile_App SHALL render the primary button with no drop shadow and no box-shadow CSS property other than `none`.
3. WHERE a primary button is contained within the bottom navigation bar or is the QR scan center action, THE Mobile_App SHALL apply the elevation token specified for that parent component in criteria 4 and 5 respectively, and the no-shadow rule of criterion 2 SHALL NOT apply.
4. WHILE the Mobile_App is rendered in light mode, THE Mobile_App SHALL render the bottom navigation bar with the elevation token `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)) as defined in Branding_Doc Section 5.
5. WHILE the Mobile_App is rendered in light mode, THE Mobile_App SHALL render the QR scan center action with the elevation token `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)) combined with a Lib_Purple-tinted halo of `shadow-lib-purple/40` as defined in Branding_Doc Section 12 Bottom Navigation.
6. WHILE the Mobile_App is rendered in light mode, THE Mobile_App SHALL produce a computed box-shadow value on every Content_Surface_Card and primary button (excluding bottom navigation bar children and QR scan center action) that is identical to the corresponding Desktop_App element's computed box-shadow value of `none`.

### Requirement 9: Mobile_OVERVIEW Rewrite

**User Story:** As the Lead Programmer, I want `apps/mobile/OVERVIEW.md` to declare the Mobile_App's role explicitly as a Desktop-subordinate React Native client, so that no future contributor reintroduces server-side logic into the Mobile_Workspace.

#### Acceptance Criteria

1. THE Mobile_OVERVIEW SHALL contain a level-2 heading (`##`) titled `Architectural Stance` that names the Desktop_App as the Single Source of Truth and cites `.kiro/steering/desktop_architecture_ssot.md` by relative path.
2. THE Mobile_OVERVIEW SHALL declare the Mobile_App platform as "Expo plus React Native" within its first 50 lines.
3. THE Mobile_OVERVIEW SHALL declare the Mobile_App backend as "Supabase (PostgreSQL, Auth, Realtime)" shared with the Desktop_App.
4. THE Mobile_OVERVIEW SHALL declare the Mobile_App role as "data-collection client" using that exact phrase.
5. THE Mobile_OVERVIEW SHALL exclude every reference to Next.js, the Next.js App Router, Prisma, SQLite, NextAuth, `next-themes`, `next-intl`, and Next.js API routes from the description of the Mobile_App stack.
6. THE Mobile_OVERVIEW SHALL declare the Mobile_App's place in the monorepo as the workspace `apps/mobile` consumed by the Workspace_Root through the workspaces declaration `apps/*`.
7. IF the Mobile_OVERVIEW retains any of the following section headers from the legacy document: "API Layer", "Database Models", "Prisma Schema", "API Routes", "Server Components", "Middleware", or "NextAuth Configuration", THEN the Migration_Audit_Report SHALL flag the section title as an "UNREMOVED LEGACY SECTION" violation.

### Requirement 10: Mobile_FEATURES Feature Reflection

**User Story:** As the Lead Programmer, I want every feature listed in `apps/mobile/FEATURES.md` to be tied to its Desktop_Counterpart, so that the Mobile_App's role as a client of the desktop administrative engine is documented at the feature level.

#### Acceptance Criteria

1. THE Mobile_FEATURES SHALL contain a single canonical feature table whose columns are exactly `Mobile Feature`, `Desktop_Counterpart`, `Direction of Data Flow`, and `Notes`, in that order.
2. THE Mobile_FEATURES SHALL map the mobile feature `QR Scanner` to the Desktop_Counterpart `Live Monitor` with Direction of Data Flow `Mobile → Desktop`.
3. THE Mobile_FEATURES SHALL map the mobile feature `Penalty View (Read-Only)` to the Desktop_Counterpart `Circulation Engine` with Direction of Data Flow `Desktop → Mobile` and SHALL note in the `Notes` column that payment processing remains on the Desktop_App.
4. THE Mobile_FEATURES SHALL map the mobile feature `Catalog` to the Desktop_Counterpart `Books Manager` with Direction of Data Flow `Desktop → Mobile`.
5. THE Mobile_FEATURES SHALL map the mobile feature `Patron Login` to the Desktop_Counterpart `Authentication Engine` with Direction of Data Flow `Bidirectional`.
6. THE Mobile_FEATURES SHALL map the mobile feature `Reservations` to the Desktop_Counterpart `Circulation Engine` with Direction of Data Flow `Mobile → Desktop`.
7. THE Mobile_FEATURES SHALL map the mobile feature `Attendance History` to the Desktop_Counterpart `Live Monitor` and the Desktop_Counterpart route `/attendance` with Direction of Data Flow `Desktop → Mobile`.
8. THE Mobile_FEATURES SHALL declare in its introduction that the Mobile_App is the data-collection client and that the Desktop_App is the administrative engine, using both phrases verbatim, and this introduction SHALL appear immediately before the canonical feature table.
9. IF a Mobile_App feature in the canonical table has no Desktop_Counterpart, THEN THE Mobile_FEATURES SHALL mark the row with the literal marker `(NO DESKTOP COUNTERPART — REVIEW REQUIRED)` in the `Desktop_Counterpart` column.
10. THE Mobile_FEATURES SHALL exclude every API endpoint table, every Prisma model description, and every reference to NextAuth, Next.js, or SQLite from the Mobile_App feature description.
11. THE Mobile_FEATURES SHALL restrict the `Direction of Data Flow` column to one of three literal values: `Mobile → Desktop`, `Desktop → Mobile`, or `Bidirectional`.
12. THE Mobile_FEATURES SHALL include one row in the canonical feature table for every user-facing screen or capability described in the document, with a minimum of 6 rows corresponding to the features enumerated in criteria 2 through 7.

### Requirement 11: Migration Auditability

**User Story:** As the Lead Programmer, I want a single auditable report of every change made by the merger, so that I can verify the SSoT enforcement and reproduce the migration if needed.

#### Acceptance Criteria

1. WHEN the merger tasks complete, THE Migration_Audit_Report SHALL exist at the path `apps/mobile/MIGRATION_AUDIT.md`.
2. IF the Migration_Audit_Report file does not exist or contains fewer than 1 non-whitespace character at the moment the merger tasks complete, THEN the merger SHALL be reported as failed regardless of whether the underlying file purges, dependency edits, branding edits, and documentation rewrites succeeded.
3. THE Migration_Audit_Report SHALL contain a section titled `Files Removed` listing every file path purged under Requirement 3, with one file path per line expressed relative to the Mobile_Workspace root (`apps/mobile/`).
4. THE Migration_Audit_Report SHALL contain a section titled `Dependencies Removed` listing every package name removed from the Mobile_Workspace_Manifest, with one package name per line.
5. THE Migration_Audit_Report SHALL contain a section titled `Dependencies Added` listing every package name added to the Mobile_Workspace_Manifest, with one package name per line.
6. THE Migration_Audit_Report SHALL contain a section titled `Branding Tokens Mapped` listing every Lib_Purple_Palette token defined in the Mobile_App_Tailwind_Config, with one token name and its hex value per line.
7. THE Migration_Audit_Report SHALL contain a section titled `Documentation Rewritten` listing the byte size and SHA-256 hash of the rewritten Mobile_OVERVIEW and Mobile_FEATURES files.
8. THE Migration_Audit_Report SHALL contain a section titled `Outstanding SSoT Violations` listing every entry produced under Requirement 5 criterion 3, or the literal text `None` if no violations were detected.
9. THE Migration_Audit_Report SHALL contain a section titled `Dependency Isolation Violations` listing every "DEPENDENCY LEAK" entry produced under Requirement 2 criterion 4 and every "LEGACY DEPENDENCY" entry produced under Requirement 2 criterion 5, or the literal text `None` if no violations were detected.
10. THE Migration_Audit_Report SHALL contain a section titled `Documentation Violations` listing every "UNREMOVED LEGACY SECTION" entry produced under Requirement 9 criterion 7, or the literal text `None` if no violations were detected.

### Requirement 12: Workspace Build Compatibility

**User Story:** As the Lead Programmer, I want both apps to build and start after the merger completes, so that the integration does not regress the existing Desktop_App.

#### Acceptance Criteria

1. WHEN `npm run dev:desktop` is executed at the Workspace_Root after the merger tasks complete, THE Desktop_App development server SHALL start, bind to the Vite default port (5173), and remain running for at least 15 seconds with a process exit code of 0 and no error-level output in stderr that references any module path under `apps/mobile`.
2. WHEN the development command declared in the Mobile_Workspace_Manifest `start` script is executed at the Workspace_Root with the `--workspace=apps/mobile` flag, THE Mobile_App development server SHALL start using the Expo runtime and remain running for at least 15 seconds with a process exit code of 0.
3. IF either development server process (criterion 1 or criterion 2) exits with a non-zero code or emits error-level output to stderr within the 15-second verification window, THEN the merger SHALL be reported as failed in the Migration_Audit_Report under a section titled `Startup Failures` that includes the failing command, its exit code, and the first 20 lines of its stderr output.
4. WHEN both development server processes satisfy their respective verification windows without failure (criteria 1 and 2), THE merger process SHALL append a `Build Compatibility: PASSED` status entry to the Migration_Audit_Report confirming that both servers started successfully under the same Workspace_Root install.

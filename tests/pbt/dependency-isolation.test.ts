/**
 * Property-Based Test: Dependency Isolation Detection
 *
 * Generates random manifest objects with injected forbidden dependencies
 * and verifies the checker flags every forbidden package with correct
 * field and path.
 *
 * **Validates: Requirements 2.4, 2.5**
 */

import {
    checkDependencyIsolation,
    type PackageManifest
} from "@tests/utils/dependency-checker";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

// --- Forbidden dependency sets ---

/** Mobile-specific deps forbidden in root/desktop manifests */
const MOBILE_SPECIFIC_DEPENDENCIES: string[] = [
  "expo",
  "expo-router",
  "expo-status-bar",
  "expo-camera",
  "expo-location",
  "expo-constants",
  "react-native",
  "@react-native/metro-config",
  "@react-native/babel-preset",
  "@react-native/typescript-config",
];

/** Legacy web framework deps forbidden in mobile manifest */
const LEGACY_WEB_FRAMEWORK_DEPENDENCIES: string[] = [
  "next",
  "next-auth",
  "next-intl",
  "next-themes",
  "eslint-config-next",
  "prisma",
  "@prisma/client",
  "bun-types",
  "@next/font",
  "@next/bundle-analyzer",
  "@next/env",
];

/** The four dependency fields to inject into */
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

// --- Arbitraries (generators) ---

/** Generate a random allowed package name (not in any forbidden set) */
const allowedPackageNameArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{2,20}$/)
  .filter(
    (name) =>
      !name.startsWith("expo") &&
      !name.startsWith("react-native") &&
      name !== "next" &&
      !name.startsWith("next-") &&
      name !== "prisma" &&
      !name.startsWith("@next/") &&
      !name.startsWith("@react-native/") &&
      !name.startsWith("@prisma/"),
  );

/** Generate a random semver version string */
const semverArb = fc
  .tuple(
    fc.integer({ min: 0, max: 20 }),
    fc.integer({ min: 0, max: 99 }),
    fc.integer({ min: 0, max: 99 }),
  )
  .map(([major, minor, patch]) => `^${major}.${minor}.${patch}`);

/** Generate a random dependency record with only allowed packages */
const allowedDepsRecordArb = fc
  .array(fc.tuple(allowedPackageNameArb, semverArb), {
    minLength: 0,
    maxLength: 5,
  })
  .map((entries) => Object.fromEntries(entries));

/** Generate a random manifest with only allowed dependencies */
const baseManifestArb: fc.Arbitrary<PackageManifest> = fc
  .record({
    name: fc.constant("test-package"),
    dependencies: allowedDepsRecordArb,
    devDependencies: allowedDepsRecordArb,
    peerDependencies: allowedDepsRecordArb,
    optionalDependencies: allowedDepsRecordArb,
  })
  .map((m) => m as PackageManifest);

/** Pick one or more forbidden deps to inject */
function forbiddenDepsArb(
  forbiddenSet: string[],
): fc.Arbitrary<Array<{ packageName: string; field: DependencyField }>> {
  return fc
    .array(
      fc.record({
        packageName: fc.constantFrom(...forbiddenSet),
        field: fc.constantFrom(...DEPENDENCY_FIELDS),
      }),
      { minLength: 1, maxLength: 4 },
    )
    .map((items) => {
      // Deduplicate by packageName+field to avoid double-counting
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = `${item.packageName}::${item.field}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })
    .filter((items) => items.length > 0);
}

/** Inject forbidden deps into a manifest and return the injected list */
function injectForbiddenDeps(
  manifest: PackageManifest,
  injections: Array<{ packageName: string; field: DependencyField }>,
): PackageManifest {
  // Deep clone to avoid mutation
  const result: PackageManifest = {
    ...manifest,
    dependencies: { ...(manifest.dependencies ?? {}) },
    devDependencies: { ...(manifest.devDependencies ?? {}) },
    peerDependencies: { ...(manifest.peerDependencies ?? {}) },
    optionalDependencies: { ...(manifest.optionalDependencies ?? {}) },
  };

  for (const { packageName, field } of injections) {
    (result[field] as Record<string, string>)[packageName] = "^1.0.0";
  }

  return result;
}

// --- Tests ---

describe("Feature: mobile-monorepo-merger, Property 1: Dependency Isolation Detection", () => {
  it("flags every injected Mobile_Specific_Dependency in root manifests", () => {
    fc.assert(
      fc.property(
        baseManifestArb,
        forbiddenDepsArb(MOBILE_SPECIFIC_DEPENDENCIES),
        fc.constantFrom("package.json", "root/package.json"),
        (baseManifest, injections, manifestPath) => {
          const manifest = injectForbiddenDeps(baseManifest, injections);
          const violations = checkDependencyIsolation(
            manifest,
            manifestPath,
            "root",
          );

          // Every injected forbidden dep must appear in violations
          for (const { packageName, field } of injections) {
            const found = violations.some(
              (v) =>
                v.packageName === packageName &&
                v.field === field &&
                v.manifestPath === manifestPath,
            );
            expect(found).toBe(true);
          }

          // Violation count must be at least the number of injections
          expect(violations.length).toBeGreaterThanOrEqual(injections.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("flags every injected Mobile_Specific_Dependency in desktop manifests", () => {
    fc.assert(
      fc.property(
        baseManifestArb,
        forbiddenDepsArb(MOBILE_SPECIFIC_DEPENDENCIES),
        fc.constantFrom(
          "apps/desktop/liblog-desktop/package.json",
          "apps/desktop/package.json",
        ),
        (baseManifest, injections, manifestPath) => {
          const manifest = injectForbiddenDeps(baseManifest, injections);
          const violations = checkDependencyIsolation(
            manifest,
            manifestPath,
            "desktop",
          );

          for (const { packageName, field } of injections) {
            const found = violations.some(
              (v) =>
                v.packageName === packageName &&
                v.field === field &&
                v.manifestPath === manifestPath,
            );
            expect(found).toBe(true);
          }

          expect(violations.length).toBeGreaterThanOrEqual(injections.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("flags every injected Legacy_Web_Framework_Dependency in mobile manifests", () => {
    fc.assert(
      fc.property(
        baseManifestArb,
        forbiddenDepsArb(LEGACY_WEB_FRAMEWORK_DEPENDENCIES),
        fc.constantFrom("apps/mobile/package.json"),
        (baseManifest, injections, manifestPath) => {
          const manifest = injectForbiddenDeps(baseManifest, injections);
          const violations = checkDependencyIsolation(
            manifest,
            manifestPath,
            "mobile",
          );

          for (const { packageName, field } of injections) {
            const found = violations.some(
              (v) =>
                v.packageName === packageName &&
                v.field === field &&
                v.manifestPath === manifestPath,
            );
            expect(found).toBe(true);
          }

          expect(violations.length).toBeGreaterThanOrEqual(injections.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("does NOT flag allowed dependencies as violations", () => {
    fc.assert(
      fc.property(
        baseManifestArb,
        fc.constantFrom<"root" | "desktop" | "mobile">(
          "root",
          "desktop",
          "mobile",
        ),
        fc.constantFrom(
          "package.json",
          "apps/mobile/package.json",
          "apps/desktop/liblog-desktop/package.json",
        ),
        (manifest, manifestType, manifestPath) => {
          // Base manifest has only allowed deps — should produce zero violations
          const violations = checkDependencyIsolation(
            manifest,
            manifestPath,
            manifestType,
          );
          expect(violations.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

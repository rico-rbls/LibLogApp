/**
 * Dependency Isolation Checker Utility
 *
 * Validates that mobile-specific dependencies don't leak into root/desktop manifests,
 * and that legacy web framework dependencies don't remain in the mobile manifest.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

/** Represents a parsed package.json manifest */
export interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/** A single dependency isolation violation */
export interface DependencyViolation {
  packageName: string;
  field: string;
  manifestPath: string;
}

/** The four dependency fields to check in a manifest */
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

/**
 * Checks if a package name is a Mobile_Specific_Dependency.
 *
 * Mobile-specific packages (forbidden in root and desktop):
 * - `expo` (exact)
 * - any package starting with `expo-`
 * - `react-native` (exact)
 * - any package starting with `@react-native/`
 */
function isMobileSpecificDependency(packageName: string): boolean {
  if (packageName === "expo") return true;
  if (packageName.startsWith("expo-")) return true;
  if (packageName === "react-native") return true;
  if (packageName.startsWith("@react-native/")) return true;
  return false;
}

/**
 * Checks if a package name is a Legacy_Web_Framework_Dependency.
 *
 * Legacy web framework packages (forbidden in mobile):
 * - `next` (exact)
 * - `next-auth` (exact)
 * - `next-intl` (exact)
 * - `next-themes` (exact)
 * - `eslint-config-next` (exact)
 * - `prisma` (exact)
 * - `@prisma/client` (exact)
 * - `bun-types` (exact)
 * - any package whose name begins with `@next/`
 */
function isLegacyWebFrameworkDependency(packageName: string): boolean {
  const exactMatches = new Set([
    "next",
    "next-auth",
    "next-intl",
    "next-themes",
    "eslint-config-next",
    "prisma",
    "@prisma/client",
    "bun-types",
  ]);

  if (exactMatches.has(packageName)) return true;
  if (packageName.startsWith("@next/")) return true;
  return false;
}

/**
 * Checks a manifest for dependency isolation violations.
 *
 * - For 'root' and 'desktop' manifests: flags any Mobile_Specific_Dependencies
 * - For 'mobile' manifests: flags any Legacy_Web_Framework_Dependencies
 *
 * Uses EXACT package name matching (the key in the dependency object),
 * not substring matching.
 *
 * @param manifest - The parsed package.json object
 * @param manifestPath - The file path of the manifest (for violation reporting)
 * @param manifestType - Which workspace the manifest belongs to
 * @returns Array of violation records
 */
export function checkDependencyIsolation(
  manifest: PackageManifest,
  manifestPath: string,
  manifestType: "root" | "desktop" | "mobile",
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];

  const isForbidden =
    manifestType === "mobile"
      ? isLegacyWebFrameworkDependency
      : isMobileSpecificDependency;

  for (const field of DEPENDENCY_FIELDS) {
    const deps = manifest[field];
    if (!deps || typeof deps !== "object") continue;

    for (const packageName of Object.keys(deps)) {
      if (isForbidden(packageName)) {
        violations.push({
          packageName,
          field,
          manifestPath,
        });
      }
    }
  }

  return violations;
}

/** Exported for testing: check if a package is mobile-specific */
export { isLegacyWebFrameworkDependency, isMobileSpecificDependency };


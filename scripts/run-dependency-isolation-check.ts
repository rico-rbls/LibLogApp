/**
 * Post-install dependency isolation check script.
 *
 * Imports `checkDependencyIsolation` from `tests/utils/dependency-checker.ts`,
 * reads and parses the root, desktop, and mobile manifests, runs the checker
 * against each, and updates MIGRATION_AUDIT.md if violations are found.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import * as fs from "fs";
import * as path from "path";
import {
    checkDependencyIsolation,
    type DependencyViolation,
    type PackageManifest,
} from "../tests/utils/dependency-checker";

const WORKSPACE_ROOT = path.resolve(__dirname, "..");

// Manifest paths
const ROOT_MANIFEST_PATH = path.join(WORKSPACE_ROOT, "package.json");
const DESKTOP_MANIFEST_PATH = path.join(
  WORKSPACE_ROOT,
  "apps",
  "desktop",
  "liblog-desktop",
  "package.json",
);
const MOBILE_MANIFEST_PATH = path.join(
  WORKSPACE_ROOT,
  "apps",
  "mobile",
  "package.json",
);
const AUDIT_REPORT_PATH = path.join(
  WORKSPACE_ROOT,
  "apps",
  "mobile",
  "MIGRATION_AUDIT.md",
);

function readManifest(manifestPath: string): PackageManifest {
  const content = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(content) as PackageManifest;
}

function formatViolations(violations: DependencyViolation[]): string {
  if (violations.length === 0) return "";
  return violations
    .map((v) => {
      const type =
        v.manifestPath === MOBILE_MANIFEST_PATH
          ? "LEGACY DEPENDENCY"
          : "DEPENDENCY LEAK";
      return `- ${type}: \`${v.packageName}\` in \`${v.field}\` of \`${v.manifestPath}\``;
    })
    .join("\n");
}

function updateAuditReport(allViolations: DependencyViolation[]): void {
  let content = fs.readFileSync(AUDIT_REPORT_PATH, "utf-8");

  const sectionHeader = "## Dependency Isolation Violations";
  const sectionIndex = content.indexOf(sectionHeader);

  if (sectionIndex === -1) {
    console.error(
      "ERROR: Could not find 'Dependency Isolation Violations' section in MIGRATION_AUDIT.md",
    );
    process.exit(1);
  }

  // Find the next section after this one (starts with ##)
  const afterHeader = content.substring(sectionIndex + sectionHeader.length);
  const nextSectionMatch = afterHeader.match(/\n## /);
  const nextSectionOffset = nextSectionMatch
    ? afterHeader.indexOf(nextSectionMatch[0])
    : afterHeader.length;

  const beforeSection = content.substring(
    0,
    sectionIndex + sectionHeader.length,
  );
  const afterSection = content.substring(
    sectionIndex + sectionHeader.length + nextSectionOffset,
  );

  let newSectionContent: string;
  if (allViolations.length === 0) {
    newSectionContent = "\n\nNone\n";
  } else {
    newSectionContent = "\n\n" + formatViolations(allViolations) + "\n";
  }

  content = beforeSection + newSectionContent + afterSection;
  fs.writeFileSync(AUDIT_REPORT_PATH, content, "utf-8");
}

// Main execution
console.log("=== Dependency Isolation Check ===\n");

// Read manifests
console.log("Reading manifests...");
const rootManifest = readManifest(ROOT_MANIFEST_PATH);
const desktopManifest = readManifest(DESKTOP_MANIFEST_PATH);
const mobileManifest = readManifest(MOBILE_MANIFEST_PATH);

console.log(`  Root: ${ROOT_MANIFEST_PATH}`);
console.log(`  Desktop: ${DESKTOP_MANIFEST_PATH}`);
console.log(`  Mobile: ${MOBILE_MANIFEST_PATH}\n`);

// Run checks
console.log("Running dependency isolation checks...\n");

const rootViolations = checkDependencyIsolation(
  rootManifest,
  ROOT_MANIFEST_PATH,
  "root",
);
const desktopViolations = checkDependencyIsolation(
  desktopManifest,
  DESKTOP_MANIFEST_PATH,
  "desktop",
);
const mobileViolations = checkDependencyIsolation(
  mobileManifest,
  MOBILE_MANIFEST_PATH,
  "mobile",
);

// Report results
console.log(`Root manifest violations: ${rootViolations.length}`);
if (rootViolations.length > 0) {
  rootViolations.forEach((v) =>
    console.log(`  - DEPENDENCY LEAK: ${v.packageName} in ${v.field}`),
  );
}

console.log(`Desktop manifest violations: ${desktopViolations.length}`);
if (desktopViolations.length > 0) {
  desktopViolations.forEach((v) =>
    console.log(`  - DEPENDENCY LEAK: ${v.packageName} in ${v.field}`),
  );
}

console.log(`Mobile manifest violations: ${mobileViolations.length}`);
if (mobileViolations.length > 0) {
  mobileViolations.forEach((v) =>
    console.log(`  - LEGACY DEPENDENCY: ${v.packageName} in ${v.field}`),
  );
}

const allViolations = [
  ...rootViolations,
  ...desktopViolations,
  ...mobileViolations,
];

console.log(`\nTotal violations: ${allViolations.length}`);

// Update audit report
if (allViolations.length > 0) {
  console.log("\nUpdating MIGRATION_AUDIT.md with violations...");
  updateAuditReport(allViolations);
  console.log(
    "Done. Violations recorded in 'Dependency Isolation Violations' section.",
  );
} else {
  console.log("\n✓ No dependency isolation violations found.");
  console.log("Verifying MIGRATION_AUDIT.md already says 'None'...");

  const auditContent = fs.readFileSync(AUDIT_REPORT_PATH, "utf-8");
  const sectionHeader = "## Dependency Isolation Violations";
  const sectionIndex = auditContent.indexOf(sectionHeader);

  if (sectionIndex !== -1) {
    const afterHeader = auditContent.substring(
      sectionIndex + sectionHeader.length,
    );
    const nextSectionMatch = afterHeader.match(/\n## /);
    const sectionContent = nextSectionMatch
      ? afterHeader.substring(0, afterHeader.indexOf(nextSectionMatch[0]))
      : afterHeader;

    if (sectionContent.trim() === "None") {
      console.log("✓ Section already contains 'None'. No update needed.");
    } else {
      console.log("Updating section to 'None'...");
      updateAuditReport([]);
      console.log("Done.");
    }
  }
}

console.log("\n=== Dependency Isolation Check Complete ===");

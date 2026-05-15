/**
 * SSoT Violation Scan Runner
 *
 * Executes the SSoT scanner against apps/mobile and saves results
 * to scan-results.json for use by the audit report generator (task 8).
 *
 * Usage: npx tsx tests/utils/run-scan.ts
 */

import * as fs from "fs";
import * as path from "path";
import { scanMobileWorkspace } from "./ssot-scanner";

const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const MOBILE_DIR = path.join(WORKSPACE_ROOT, "apps", "mobile");
const OUTPUT_PATH = path.join(
  WORKSPACE_ROOT,
  "tests",
  "utils",
  "scan-results.json",
);

console.log("=== SSoT Violation Scanner ===");
console.log(`Scanning: ${MOBILE_DIR}`);
console.log("");

// Run the scan
const result = scanMobileWorkspace(MOBILE_DIR);

// Print summary
console.log(`Violations found: ${result.violations.length}`);
console.log("");

if (result.violations.length > 0) {
  console.log("--- Violations ---");
  for (const v of result.violations) {
    console.log(`  [${v.violationType}] ${v.detail}`);
  }
  console.log("");
}

console.log("--- Legacy Files ---");
console.log(`  API Routes: ${result.legacyFiles.apiRoutes.length}`);
console.log(`  Next.js Configs: ${result.legacyFiles.nextConfigs.length}`);
console.log(`  Prisma Directory: ${result.legacyFiles.prismaDir.length}`);
console.log(`  Databases: ${result.legacyFiles.databases.length}`);
console.log(`  Build Artifacts: ${result.legacyFiles.buildArtifacts.length}`);
console.log(`  PostCSS Configs: ${result.legacyFiles.postcssConfigs.length}`);
console.log("");

// Save results to JSON
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), "utf-8");
console.log(`Results saved to: ${OUTPUT_PATH}`);

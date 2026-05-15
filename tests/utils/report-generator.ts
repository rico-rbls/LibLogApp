import { SSOTViolation } from "./ssot-scanner";

/**
 * Generates the "Outstanding SSoT Violations" section of the Migration Audit Report.
 *
 * If violations array is empty, returns "None".
 * Otherwise, returns one entry per line with file path and detail.
 */
export function generateViolationReportSection(
  violations: SSOTViolation[],
): string {
  if (violations.length === 0) {
    return "None";
  }

  return violations
    .map((v) => `- ${v.filePath}: [${v.violationType}] ${v.detail}`)
    .join("\n");
}

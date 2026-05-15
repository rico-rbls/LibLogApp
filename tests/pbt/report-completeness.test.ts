import { generateViolationReportSection } from "@tests/utils/report-generator";
import { SSOTViolation } from "@tests/utils/ssot-scanner";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Feature: mobile-monorepo-merger, Property 3: Violation Report Completeness
 *
 * For any set of detected SSoT violations produced by the scanner, the Migration
 * Audit Report generator SHALL include every violation in the "Outstanding SSoT
 * Violations" section, such that the count of violations in the report equals the
 * count of violations detected by the scanner.
 *
 * **Validates: Requirements 5.3, 5.4**
 */

const violationTypeArb = fc.constantFrom(
  "ROUTE_HANDLER" as const,
  "FORBIDDEN_IMPORT" as const,
  "HTTP_SERVER" as const,
);

const filePathArb = fc
  .stringOf(
    fc.constantFrom(
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "/",
      "-",
      "_",
      ".",
    ),
    { minLength: 5, maxLength: 60 },
  )
  .map((s) => `src/${s}.ts`);

const detailArb = fc.stringOf(
  fc.constantFrom(
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    " ",
    "'",
    "/",
    "@",
    "-",
  ),
  { minLength: 5, maxLength: 80 },
);

const violationArb: fc.Arbitrary<SSOTViolation> = fc.record({
  filePath: filePathArb,
  violationType: violationTypeArb,
  detail: detailArb,
});

const violationsArrayArb = fc.array(violationArb, {
  minLength: 0,
  maxLength: 30,
});

describe("Feature: mobile-monorepo-merger, Property 3: Violation Report Completeness", () => {
  it("report entry count equals input violation count", () => {
    fc.assert(
      fc.property(violationsArrayArb, (violations) => {
        const report = generateViolationReportSection(violations);

        if (violations.length === 0) {
          expect(report).toBe("None");
        } else {
          const reportLines = report.split("\n");
          expect(reportLines.length).toBe(violations.length);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every violation filePath appears in the report output", () => {
    fc.assert(
      fc.property(
        violationsArrayArb.filter((v) => v.length > 0),
        (violations) => {
          const report = generateViolationReportSection(violations);

          for (const violation of violations) {
            expect(report).toContain(violation.filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("empty violations array produces 'None'", () => {
    fc.assert(
      fc.property(fc.constant([] as SSOTViolation[]), (violations) => {
        const report = generateViolationReportSection(violations);
        expect(report).toBe("None");
      }),
      { numRuns: 100 },
    );
  });

  it("every violation detail appears in the report output", () => {
    fc.assert(
      fc.property(
        violationsArrayArb.filter((v) => v.length > 0),
        (violations) => {
          const report = generateViolationReportSection(violations);

          for (const violation of violations) {
            expect(report).toContain(violation.detail);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const OVERVIEW_PATH = path.join(WORKSPACE_ROOT, "apps/mobile/OVERVIEW.md");
const FEATURES_PATH = path.join(WORKSPACE_ROOT, "apps/mobile/FEATURES.md");

const overviewContent = fs.readFileSync(OVERVIEW_PATH, "utf-8");
const featuresContent = fs.readFileSync(FEATURES_PATH, "utf-8");

describe("OVERVIEW.md — Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.7", () => {
  describe("Required headings and phrases", () => {
    it("contains ## Architectural Stance heading (Req 9.1)", () => {
      expect(overviewContent).toMatch(/^## Architectural Stance/m);
    });

    it("Architectural Stance section cites .kiro/steering/desktop_architecture_ssot.md (Req 9.1)", () => {
      // Extract the Architectural Stance section
      const stanceStart = overviewContent.indexOf("## Architectural Stance");
      expect(stanceStart).toBeGreaterThan(-1);
      // Get content from the heading to the next ## heading
      const afterStance = overviewContent.slice(stanceStart);
      const nextHeading = afterStance.indexOf("\n## ", 1);
      const stanceSection =
        nextHeading > -1 ? afterStance.slice(0, nextHeading) : afterStance;
      expect(stanceSection).toContain(
        ".kiro/steering/desktop_architecture_ssot.md",
      );
    });

    it('contains "Expo plus React Native" within first 50 lines (Req 9.2)', () => {
      const first50Lines = overviewContent.split("\n").slice(0, 50).join("\n");
      expect(first50Lines).toContain("Expo plus React Native");
    });

    it('contains "Supabase (PostgreSQL, Auth, Realtime)" (Req 9.3)', () => {
      expect(overviewContent).toContain(
        "Supabase (PostgreSQL, Auth, Realtime)",
      );
    });

    it('contains exact phrase "data-collection client" (Req 9.4)', () => {
      expect(overviewContent).toContain("data-collection client");
    });

    it("contains apps/mobile reference (Req 9.6)", () => {
      expect(overviewContent).toContain("apps/mobile");
    });

    it("contains apps/* workspace glob reference (Req 9.6)", () => {
      expect(overviewContent).toContain("apps/*");
    });
  });

  describe("Forbidden terms — Requirement 9.5", () => {
    const forbiddenTerms = [
      "Next.js",
      "Prisma",
      "SQLite",
      "NextAuth",
      "next-themes",
      "next-intl",
    ];

    for (const term of forbiddenTerms) {
      it(`does NOT contain "${term}"`, () => {
        expect(overviewContent).not.toContain(term);
      });
    }
  });

  describe("No legacy section headers — Requirement 9.7", () => {
    const legacySections = [
      "API Layer",
      "Database Models",
      "Prisma Schema",
      "API Routes",
      "Server Components",
      "Middleware",
      "NextAuth Configuration",
    ];

    for (const header of legacySections) {
      it(`does NOT contain legacy section header "${header}"`, () => {
        // Check for markdown heading patterns with this text
        const headingPattern = new RegExp(
          `^#{1,6}\\s+.*${header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "m",
        );
        expect(overviewContent).not.toMatch(headingPattern);
      });
    }
  });
});

describe("FEATURES.md — Requirements 10.1, 10.8, 10.10, 10.11, 10.12", () => {
  describe("Required phrases — Requirement 10.8", () => {
    it('contains exact phrase "data-collection client"', () => {
      expect(featuresContent).toContain("data-collection client");
    });

    it('contains exact phrase "administrative engine"', () => {
      expect(featuresContent).toContain("administrative engine");
    });
  });

  describe("Canonical feature table structure — Requirement 10.1", () => {
    it("has a markdown table with correct columns: Mobile Feature, Desktop_Counterpart, Direction of Data Flow, Notes", () => {
      // Match the header row of the table
      const headerPattern =
        /\|\s*Mobile Feature\s*\|\s*Desktop_Counterpart\s*\|\s*Direction of Data Flow\s*\|\s*Notes\s*\|/;
      expect(featuresContent).toMatch(headerPattern);
    });

    it("has minimum 6 data rows in the table (Req 10.12)", () => {
      // Find the table: header row, separator row, then data rows
      const lines = featuresContent.split("\n");
      const headerIndex = lines.findIndex((line) =>
        /\|\s*Mobile Feature\s*\|/.test(line),
      );
      expect(headerIndex).toBeGreaterThan(-1);

      // Skip header and separator rows, count data rows
      let dataRowCount = 0;
      for (let i = headerIndex + 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (
          line.startsWith("|") &&
          line.endsWith("|") &&
          !line.match(/^\|[\s-:|]+\|$/)
        ) {
          dataRowCount++;
        } else if (line === "" || !line.startsWith("|")) {
          break;
        }
      }
      expect(dataRowCount).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Direction of Data Flow values — Requirement 10.11", () => {
    it("all Direction values are one of: Mobile → Desktop, Desktop → Mobile, Bidirectional", () => {
      const validDirections = [
        "Mobile → Desktop",
        "Desktop → Mobile",
        "Bidirectional",
      ];

      const lines = featuresContent.split("\n");
      const headerIndex = lines.findIndex((line) =>
        /\|\s*Mobile Feature\s*\|/.test(line),
      );
      expect(headerIndex).toBeGreaterThan(-1);

      // Parse data rows and extract Direction column (3rd column, index 2)
      for (let i = headerIndex + 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (
          line.startsWith("|") &&
          line.endsWith("|") &&
          !line.match(/^\|[\s-:|]+\|$/)
        ) {
          const columns = line
            .split("|")
            .filter((col) => col !== "")
            .map((col) => col.trim());
          if (columns.length >= 3) {
            const direction = columns[2];
            expect(
              validDirections.includes(direction),
              `Invalid direction value: "${direction}" — must be one of: ${validDirections.join(", ")}`,
            ).toBe(true);
          }
        } else if (line === "" || !line.startsWith("|")) {
          break;
        }
      }
    });
  });

  describe("Forbidden terms — Requirement 10.10", () => {
    const forbiddenTerms = [
      "NextAuth",
      "Next.js",
      "SQLite",
      "Prisma",
      "API endpoint",
    ];

    for (const term of forbiddenTerms) {
      it(`does NOT contain "${term}"`, () => {
        expect(featuresContent).not.toContain(term);
      });
    }
  });

  describe("Required feature mappings — Requirements 10.2–10.7", () => {
    it("contains QR Scanner feature", () => {
      expect(featuresContent).toContain("QR Scanner");
    });

    it("contains Penalty View feature", () => {
      expect(featuresContent).toMatch(/Penalty View/);
    });

    it("contains Catalog feature", () => {
      expect(featuresContent).toContain("Catalog");
    });

    it("contains Patron Login feature", () => {
      expect(featuresContent).toContain("Patron Login");
    });

    it("contains Reservations feature", () => {
      expect(featuresContent).toContain("Reservations");
    });

    it("contains Attendance History feature", () => {
      expect(featuresContent).toContain("Attendance History");
    });
  });
});

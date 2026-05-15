import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const AUDIT_REPORT_PATH = path.join(
  WORKSPACE_ROOT,
  "apps/mobile/MIGRATION_AUDIT.md",
);

describe("Migration Audit Report Structure", () => {
  const content = fs.readFileSync(AUDIT_REPORT_PATH, "utf-8");

  describe("File existence and content — Requirement 11.2", () => {
    it("file exists and has more than 1 non-whitespace character", () => {
      expect(fs.existsSync(AUDIT_REPORT_PATH)).toBe(true);
      const nonWhitespace = content.replace(/\s/g, "");
      expect(nonWhitespace.length).toBeGreaterThan(1);
    });
  });

  describe("Required sections — Requirements 11.3–11.10", () => {
    it("contains section '## Files Removed' (Req 11.3)", () => {
      expect(content).toMatch(/^## Files Removed$/m);
    });

    it("contains section '## Dependencies Removed' (Req 11.4)", () => {
      expect(content).toMatch(/^## Dependencies Removed$/m);
    });

    it("contains section '## Dependencies Added' (Req 11.5)", () => {
      expect(content).toMatch(/^## Dependencies Added$/m);
    });

    it("contains section '## Branding Tokens Mapped' (Req 11.6)", () => {
      expect(content).toMatch(/^## Branding Tokens Mapped$/m);
    });

    it("contains section '## Documentation Rewritten' (Req 11.7)", () => {
      expect(content).toMatch(/^## Documentation Rewritten$/m);
    });

    it("contains section '## Outstanding SSoT Violations' (Req 11.8)", () => {
      expect(content).toMatch(/^## Outstanding SSoT Violations$/m);
    });

    it("contains section '## Dependency Isolation Violations' (Req 11.9)", () => {
      expect(content).toMatch(/^## Dependency Isolation Violations$/m);
    });

    it("contains section '## Documentation Violations' (Req 11.10)", () => {
      expect(content).toMatch(/^## Documentation Violations$/m);
    });
  });

  describe("File paths in 'Files Removed' are relative — Requirement 11.3", () => {
    it("no file path starts with a drive letter (e.g. C:\\)", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      const lines = filesRemovedSection
        .split("\n")
        .filter((line) => line.startsWith("- "));
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        const filePath = line.replace(/^- /, "").trim();
        expect(filePath).not.toMatch(/^[A-Za-z]:\\/);
      }
    });

    it("no file path starts with a forward slash (/)", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      const lines = filesRemovedSection
        .split("\n")
        .filter((line) => line.startsWith("- "));
      for (const line of lines) {
        const filePath = line.replace(/^- /, "").trim();
        expect(filePath).not.toMatch(/^\//);
      }
    });
  });

  describe("'Files Removed' has categorized subsections — Requirement 11.3", () => {
    it("contains subsection for API Routes", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      expect(filesRemovedSection).toMatch(/^### API Routes$/m);
    });

    it("contains subsection for Next.js Configs", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      expect(filesRemovedSection).toMatch(/^### Next\.js Configs$/m);
    });

    it("contains subsection for Prisma Directory", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      expect(filesRemovedSection).toMatch(/^### Prisma Directory$/m);
    });

    it("contains subsection for Databases", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      expect(filesRemovedSection).toMatch(/^### Databases$/m);
    });

    it("contains subsection for Build Artifacts", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      expect(filesRemovedSection).toMatch(/^### Build Artifacts$/m);
    });

    it("contains subsection for PostCSS Configs", () => {
      const filesRemovedSection = extractSection(content, "Files Removed");
      expect(filesRemovedSection).toMatch(/^### PostCSS Configs$/m);
    });
  });

  describe("Dependencies Removed/Added format — Requirements 11.4, 11.5", () => {
    it("each entry in 'Dependencies Removed' is one per line starting with '- '", () => {
      const section = extractSection(content, "Dependencies Removed");
      const nonEmptyLines = section
        .split("\n")
        .filter((line) => line.trim().length > 0);
      expect(nonEmptyLines.length).toBeGreaterThan(0);
      for (const line of nonEmptyLines) {
        expect(line).toMatch(/^- .+/);
      }
    });

    it("each entry in 'Dependencies Added' is one per line starting with '- '", () => {
      const section = extractSection(content, "Dependencies Added");
      const nonEmptyLines = section
        .split("\n")
        .filter((line) => line.trim().length > 0);
      expect(nonEmptyLines.length).toBeGreaterThan(0);
      for (const line of nonEmptyLines) {
        expect(line).toMatch(/^- .+/);
      }
    });
  });

  describe("Branding Tokens format — Requirement 11.6", () => {
    it("entries are in format '- lib-purple-{shade}: #{hex}'", () => {
      const section = extractSection(content, "Branding Tokens Mapped");
      const lines = section.split("\n").filter((line) => line.startsWith("- "));
      expect(lines.length).toBeGreaterThanOrEqual(10);
      for (const line of lines) {
        expect(line).toMatch(/^- lib-purple-\d+: #[0-9A-Fa-f]{6}$/);
      }
    });
  });
});

/**
 * Extracts the content of a section from the markdown document.
 * A section starts with `## Title` and ends at the next `## ` heading or end of file.
 */
function extractSection(markdown: string, sectionTitle: string): string {
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^## ${escapedTitle}$\\n([\\s\\S]*?)(?=^## |$(?!\\n))`,
    "m",
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : "";
}

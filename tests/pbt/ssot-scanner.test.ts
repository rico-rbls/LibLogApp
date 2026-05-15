import { scanFileContent } from "@tests/utils/ssot-scanner";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 2: SSoT Violation Detection
 *
 * For any TypeScript/JavaScript source file whose content contains a forbidden pattern
 * (exporting a Next.js Route Handler symbol, importing from forbidden modules, or
 * instantiating an HTTP server), the SSoT violation scanner SHALL classify that file
 * as a violation and produce a violation record containing the file path and the
 * specific offending pattern.
 *
 * **Validates: Requirements 5.1, 5.2, 5.6**
 */
describe("Feature: mobile-monorepo-merger, Property 2: SSoT Violation Detection", () => {
  // --- Arbitraries ---

  /** Generate valid TypeScript/JavaScript file paths */
  const filePathArb = fc
    .tuple(
      fc.constantFrom("src/app/api/", "src/", "app/api/", "lib/", "utils/"),
      fc.array(
        fc.stringOf(
          fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")),
          {
            minLength: 1,
            maxLength: 8,
          },
        ),
        { minLength: 0, maxLength: 3 },
      ),
      fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
        minLength: 1,
        maxLength: 12,
      }),
      fc.constantFrom(".ts", ".tsx", ".js", ".jsx"),
    )
    .map(([prefix, dirs, filename, ext]) => {
      const dirPath = dirs.length > 0 ? dirs.join("/") + "/" : "";
      return `${prefix}${dirPath}${filename}${ext}`;
    });

  /** HTTP methods for Route Handler exports */
  const httpMethodArb = fc.constantFrom(
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
  );

  /** Generate route handler export patterns */
  const routeHandlerArb = fc
    .tuple(
      httpMethodArb,
      fc.constantFrom(
        "export async function",
        "export function",
        "export const",
      ),
    )
    .map(([method, exportStyle]) => {
      if (exportStyle === "export const") {
        return `${exportStyle} ${method} = async (req: Request) => { return new Response("ok"); }`;
      }
      return `${exportStyle} ${method}(req: Request) { return new Response("ok"); }`;
    });

  /** Forbidden import modules */
  const forbiddenModuleArb = fc.constantFrom(
    "next/server",
    "next-auth",
    "@prisma/client",
    "prisma",
  );

  /** Generate forbidden import patterns */
  const forbiddenImportArb = fc
    .tuple(
      forbiddenModuleArb,
      fc.constantFrom("'", '"'),
      fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
        minLength: 1,
        maxLength: 8,
      }),
    )
    .map(([module, quote, importName]) => {
      return `import { ${importName} } from ${quote}${module}${quote}`;
    });

  /** Generate HTTP server instantiation patterns */
  const httpServerArb = fc.constantFrom(
    "const app = express()",
    "const server = fastify()",
    "const app = new Hono()",
    "const server = createServer(handler)",
    "http.createServer(app)",
    "https.createServer(opts, app)",
  );

  /** Generate random filler code that does NOT contain forbidden patterns */
  const safeCodeArb = fc
    .array(
      fc.constantFrom(
        "const x = 1;",
        "function helper() { return true; }",
        "// This is a comment",
        "import { useState } from 'react';",
        "export default function Page() { return null; }",
        "const data = await fetch('/api/data');",
        "console.log('hello');",
        "type Props = { name: string };",
        "interface Config { url: string; }",
        "",
      ),
      { minLength: 0, maxLength: 5 },
    )
    .map((lines) => lines.join("\n"));

  // --- Property Tests ---

  it("should detect route handler exports as ROUTE_HANDLER violations", () => {
    fc.assert(
      fc.property(
        filePathArb,
        routeHandlerArb,
        safeCodeArb,
        safeCodeArb,
        (filePath, routeHandler, codeBefore, codeAfter) => {
          const content = `${codeBefore}\n${routeHandler}\n${codeAfter}`;
          const violations = scanFileContent(filePath, content);

          // Must detect at least one ROUTE_HANDLER violation
          const routeViolations = violations.filter(
            (v) => v.violationType === "ROUTE_HANDLER",
          );
          expect(routeViolations.length).toBeGreaterThanOrEqual(1);

          // Each violation must reference the correct file path
          for (const v of routeViolations) {
            expect(v.filePath).toBe(filePath);
            expect(v.detail).toContain(filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should detect forbidden imports as FORBIDDEN_IMPORT violations", () => {
    fc.assert(
      fc.property(
        filePathArb,
        forbiddenImportArb,
        safeCodeArb,
        safeCodeArb,
        (filePath, forbiddenImport, codeBefore, codeAfter) => {
          const content = `${codeBefore}\n${forbiddenImport}\n${codeAfter}`;
          const violations = scanFileContent(filePath, content);

          // Must detect at least one FORBIDDEN_IMPORT violation
          const importViolations = violations.filter(
            (v) => v.violationType === "FORBIDDEN_IMPORT",
          );
          expect(importViolations.length).toBeGreaterThanOrEqual(1);

          // Each violation must reference the correct file path
          for (const v of importViolations) {
            expect(v.filePath).toBe(filePath);
            expect(v.detail).toContain(filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should detect HTTP server patterns as HTTP_SERVER violations", () => {
    fc.assert(
      fc.property(
        filePathArb,
        httpServerArb,
        safeCodeArb,
        safeCodeArb,
        (filePath, httpServer, codeBefore, codeAfter) => {
          const content = `${codeBefore}\n${httpServer}\n${codeAfter}`;
          const violations = scanFileContent(filePath, content);

          // Must detect at least one HTTP_SERVER violation
          const serverViolations = violations.filter(
            (v) => v.violationType === "HTTP_SERVER",
          );
          expect(serverViolations.length).toBeGreaterThanOrEqual(1);

          // Each violation must reference the correct file path
          for (const v of serverViolations) {
            expect(v.filePath).toBe(filePath);
            expect(v.detail).toContain(filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should detect all violation types when multiple forbidden patterns are present", () => {
    fc.assert(
      fc.property(
        filePathArb,
        routeHandlerArb,
        forbiddenImportArb,
        httpServerArb,
        safeCodeArb,
        (filePath, routeHandler, forbiddenImport, httpServer, safeCode) => {
          const content = [
            safeCode,
            routeHandler,
            forbiddenImport,
            httpServer,
          ].join("\n");
          const violations = scanFileContent(filePath, content);

          // Must detect at least one of each violation type
          const types = new Set(violations.map((v) => v.violationType));
          expect(types.has("ROUTE_HANDLER")).toBe(true);
          expect(types.has("FORBIDDEN_IMPORT")).toBe(true);
          expect(types.has("HTTP_SERVER")).toBe(true);

          // All violations must reference the correct file path
          for (const v of violations) {
            expect(v.filePath).toBe(filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should produce violation records with correct structure for any forbidden pattern", () => {
    const patternArb = fc.oneof(
      routeHandlerArb.map((p) => ({
        pattern: p,
        expectedType: "ROUTE_HANDLER" as const,
      })),
      forbiddenImportArb.map((p) => ({
        pattern: p,
        expectedType: "FORBIDDEN_IMPORT" as const,
      })),
      httpServerArb.map((p) => ({
        pattern: p,
        expectedType: "HTTP_SERVER" as const,
      })),
    );

    fc.assert(
      fc.property(
        filePathArb,
        patternArb,
        safeCodeArb,
        (filePath, { pattern, expectedType }, safeCode) => {
          const content = `${safeCode}\n${pattern}`;
          const violations = scanFileContent(filePath, content);

          // Must have at least one violation
          expect(violations.length).toBeGreaterThanOrEqual(1);

          // At least one violation must match the expected type
          const matchingViolations = violations.filter(
            (v) => v.violationType === expectedType,
          );
          expect(matchingViolations.length).toBeGreaterThanOrEqual(1);

          // Verify violation record structure
          for (const v of matchingViolations) {
            expect(v).toHaveProperty("filePath");
            expect(v).toHaveProperty("violationType");
            expect(v).toHaveProperty("detail");
            expect(v.filePath).toBe(filePath);
            expect(v.violationType).toBe(expectedType);
            expect(typeof v.detail).toBe("string");
            expect(v.detail.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

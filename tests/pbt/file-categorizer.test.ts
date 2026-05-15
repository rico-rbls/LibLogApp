/**
 * Property-Based Test: File Categorization Correctness
 *
 * Feature: mobile-monorepo-merger, Property 4: File Categorization Correctness
 *
 * For any set of file paths removed from the Mobile_Workspace during the purge,
 * the audit report categorizer SHALL assign each file to exactly one category
 * (API Routes, Next.js Configs, Prisma Directory, Databases, Build Artifacts,
 * or PostCSS Configs) based on its path pattern, and every removed file SHALL
 * appear in the report under its correct category.
 *
 * **Validates: Requirements 3.7**
 */

import {
    categorizeFiles,
    type CategorizedFiles,
} from "@tests/utils/file-categorizer";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

// --- Generators ---

/** Generate a random segment for use in file paths (alphanumeric, lowercase) */
const segmentArb = fc.stringOf(
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-_".split("")),
  { minLength: 1, maxLength: 12 },
);

/** Generate random API Route paths: src/app/api/{segment}/route.ts */
const apiRouteArb = segmentArb.chain((seg) =>
  fc.constant(`src/app/api/${seg}/route.ts`),
);

/** Generate random Next.js config paths (possibly nested) */
const nextConfigArb = fc
  .tuple(
    fc.option(segmentArb, { nil: undefined }),
    fc.constantFrom("next.config.ts", "next.config.js", "next.config.mjs"),
  )
  .map(([prefix, filename]) => (prefix ? `${prefix}/${filename}` : filename));

/** Generate random Prisma directory paths */
const prismaDirArb = fc.oneof(
  segmentArb.map((seg) => `prisma/${seg}.prisma`),
  segmentArb.map((seg) => `prisma/migrations/${seg}.sql`),
  segmentArb.map((seg) => `prisma/${seg}.ts`),
);

/** Generate random database file paths */
const databaseArb = fc
  .tuple(
    fc.option(segmentArb, { nil: undefined }),
    segmentArb,
    fc.constantFrom(".db", ".sqlite", ".sqlite3"),
  )
  .map(([dir, name, ext]) => (dir ? `${dir}/${name}${ext}` : `${name}${ext}`));

/** Generate random build artifact paths (app-paths-manifest.json, possibly nested) */
const buildArtifactArb = fc
  .option(segmentArb, { nil: undefined })
  .map((prefix) =>
    prefix ? `${prefix}/app-paths-manifest.json` : "app-paths-manifest.json",
  );

/** Generate postcss.config.mjs (always the same filename) */
const postcssConfigArb = fc.constant("postcss.config.mjs");

/** Tagged arbitrary: generates a file path along with its expected category */
interface TaggedFile {
  path: string;
  expectedCategory: keyof CategorizedFiles;
}

const taggedFileArb: fc.Arbitrary<TaggedFile> = fc.oneof(
  apiRouteArb.map((p) => ({ path: p, expectedCategory: "apiRoutes" as const })),
  nextConfigArb.map((p) => ({
    path: p,
    expectedCategory: "nextConfigs" as const,
  })),
  prismaDirArb.map((p) => ({
    path: p,
    expectedCategory: "prismaDir" as const,
  })),
  databaseArb.map((p) => ({
    path: p,
    expectedCategory: "databases" as const,
  })),
  buildArtifactArb.map((p) => ({
    path: p,
    expectedCategory: "buildArtifacts" as const,
  })),
  postcssConfigArb.map((p) => ({
    path: p,
    expectedCategory: "postcssConfigs" as const,
  })),
);

// --- Helper ---

/** Get all files across all categories in the result */
function getAllCategorizedFiles(result: CategorizedFiles): string[] {
  return [
    ...result.apiRoutes,
    ...result.nextConfigs,
    ...result.prismaDir,
    ...result.databases,
    ...result.buildArtifacts,
    ...result.postcssConfigs,
  ];
}

/** Count how many categories a file appears in */
function countCategoryAppearances(
  filePath: string,
  result: CategorizedFiles,
): number {
  let count = 0;
  if (result.apiRoutes.includes(filePath)) count++;
  if (result.nextConfigs.includes(filePath)) count++;
  if (result.prismaDir.includes(filePath)) count++;
  if (result.databases.includes(filePath)) count++;
  if (result.buildArtifacts.includes(filePath)) count++;
  if (result.postcssConfigs.includes(filePath)) count++;
  return count;
}

// --- Tests ---

describe("Feature: mobile-monorepo-merger, Property 4: File Categorization Correctness", () => {
  it("every generated file is assigned to exactly one category", () => {
    fc.assert(
      fc.property(
        fc.array(taggedFileArb, { minLength: 1, maxLength: 20 }),
        (taggedFiles) => {
          const filePaths = taggedFiles.map((tf) => tf.path);
          const result = categorizeFiles(filePaths);
          const allCategorized = getAllCategorizedFiles(result);

          for (const filePath of filePaths) {
            const appearances = countCategoryAppearances(filePath, result);
            // Each file must appear in exactly one category
            expect(appearances).toBe(1);
            // Each file must appear somewhere in the categorized output
            expect(allCategorized).toContain(filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("every file appears in its CORRECT category based on generation pattern", () => {
    fc.assert(
      fc.property(
        fc.array(taggedFileArb, { minLength: 1, maxLength: 20 }),
        (taggedFiles) => {
          const filePaths = taggedFiles.map((tf) => tf.path);
          const result = categorizeFiles(filePaths);

          for (const { path: filePath, expectedCategory } of taggedFiles) {
            const categoryArray = result[expectedCategory];
            expect(categoryArray).toContain(filePath);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("no file appears in multiple categories", () => {
    fc.assert(
      fc.property(
        fc.array(taggedFileArb, { minLength: 1, maxLength: 20 }),
        (taggedFiles) => {
          const filePaths = taggedFiles.map((tf) => tf.path);
          const result = categorizeFiles(filePaths);

          for (const filePath of filePaths) {
            const appearances = countCategoryAppearances(filePath, result);
            expect(appearances).toBeLessThanOrEqual(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

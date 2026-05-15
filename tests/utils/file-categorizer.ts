/**
 * File Categorizer Utility
 *
 * Categorizes file paths (relative to apps/mobile/) into legacy artifact categories
 * for use in the Migration Audit Report.
 *
 * Each file is assigned to exactly one category based on path pattern matching.
 * Priority order (if a file could match multiple):
 *   API Routes > Next.js Configs > Prisma Directory > Databases > Build Artifacts > PostCSS Configs
 *
 * @see Requirements 3.7, 11.3
 */

export interface CategorizedFiles {
  apiRoutes: string[];
  nextConfigs: string[];
  prismaDir: string[];
  databases: string[];
  buildArtifacts: string[];
  postcssConfigs: string[];
}

/**
 * Categorizes an array of file paths into legacy artifact categories.
 *
 * @param filePaths - Array of file paths relative to apps/mobile/
 * @returns CategorizedFiles with each file assigned to exactly one category.
 *          Files that don't match any category are excluded from the result.
 */
export function categorizeFiles(filePaths: string[]): CategorizedFiles {
  const result: CategorizedFiles = {
    apiRoutes: [],
    nextConfigs: [],
    prismaDir: [],
    databases: [],
    buildArtifacts: [],
    postcssConfigs: [],
  };

  for (const filePath of filePaths) {
    // Normalize path separators to forward slashes for consistent matching
    const normalized = filePath.replace(/\\/g, "/");

    // Priority 1: API Routes — paths matching src/app/api/**
    if (isApiRoute(normalized)) {
      result.apiRoutes.push(filePath);
      continue;
    }

    // Priority 2: Next.js Configs — next.config.ts, next.config.js, or next.config.mjs at any depth
    if (isNextConfig(normalized)) {
      result.nextConfigs.push(filePath);
      continue;
    }

    // Priority 3: Prisma Directory — any file under a prisma/ directory at any depth
    if (isPrismaDir(normalized)) {
      result.prismaDir.push(filePath);
      continue;
    }

    // Priority 4: Databases — files with extension .db, .sqlite, or .sqlite3
    if (isDatabase(normalized)) {
      result.databases.push(filePath);
      continue;
    }

    // Priority 5: Build Artifacts — files named app-paths-manifest.json
    if (isBuildArtifact(normalized)) {
      result.buildArtifacts.push(filePath);
      continue;
    }

    // Priority 6: PostCSS Configs — files named postcss.config.mjs
    if (isPostcssConfig(normalized)) {
      result.postcssConfigs.push(filePath);
      continue;
    }

    // Files that don't match any category are excluded
  }

  return result;
}

/**
 * Checks if a file path matches the API Routes pattern: src/app/api/**
 */
function isApiRoute(normalizedPath: string): boolean {
  // Match any file under src/app/api/ at any depth
  return (
    normalizedPath.startsWith("src/app/api/") ||
    normalizedPath === "src/app/api"
  );
}

/**
 * Checks if a file path matches a Next.js config file at any depth.
 * Matches: next.config.ts, next.config.js, next.config.mjs
 */
function isNextConfig(normalizedPath: string): boolean {
  const fileName = getFileName(normalizedPath);
  return (
    fileName === "next.config.ts" ||
    fileName === "next.config.js" ||
    fileName === "next.config.mjs"
  );
}

/**
 * Checks if a file path is under a prisma/ directory at any depth.
 */
function isPrismaDir(normalizedPath: string): boolean {
  // Match files that are inside a prisma/ directory at any level
  return (
    normalizedPath.startsWith("prisma/") ||
    normalizedPath.includes("/prisma/") ||
    normalizedPath === "prisma"
  );
}

/**
 * Checks if a file has a database extension: .db, .sqlite, or .sqlite3
 */
function isDatabase(normalizedPath: string): boolean {
  return (
    normalizedPath.endsWith(".db") ||
    normalizedPath.endsWith(".sqlite") ||
    normalizedPath.endsWith(".sqlite3")
  );
}

/**
 * Checks if a file is a Next.js build artifact: app-paths-manifest.json
 */
function isBuildArtifact(normalizedPath: string): boolean {
  const fileName = getFileName(normalizedPath);
  return fileName === "app-paths-manifest.json";
}

/**
 * Checks if a file is a PostCSS config: postcss.config.mjs
 */
function isPostcssConfig(normalizedPath: string): boolean {
  const fileName = getFileName(normalizedPath);
  return fileName === "postcss.config.mjs";
}

/**
 * Extracts the file name from a normalized path.
 */
function getFileName(normalizedPath: string): string {
  const parts = normalizedPath.split("/");
  return parts[parts.length - 1];
}

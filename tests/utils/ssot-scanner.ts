import * as fs from "fs";
import * as path from "path";

// --- Interfaces ---

export interface SSOTViolation {
  filePath: string; // relative to apps/mobile/
  violationType: "ROUTE_HANDLER" | "FORBIDDEN_IMPORT" | "HTTP_SERVER";
  detail: string; // e.g., "exports GET from src/app/api/auth/login/route.ts"
}

export interface ScanResult {
  violations: SSOTViolation[];
  legacyFiles: {
    apiRoutes: string[];
    nextConfigs: string[];
    prismaDir: string[];
    databases: string[];
    buildArtifacts: string[]; // app-paths-manifest.json
    postcssConfigs: string[];
  };
}

// --- Detection Patterns ---

/**
 * Matches Route Handler exports:
 * - export async function GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS
 * - export function GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS
 * - export const GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS
 */
const ROUTE_HANDLER_REGEX =
  /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)|export\s+const\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/g;

/**
 * Matches forbidden imports:
 * - import ... from 'next/server'
 * - import ... from "next/server"
 * - import ... from 'next-auth'
 * - import ... from "next-auth"
 * - import ... from '@prisma/client'
 * - import ... from "@prisma/client"
 * - import ... from 'prisma'
 * - import ... from "prisma"
 * Also catches dynamic imports: import('next/server'), etc.
 */
const FORBIDDEN_IMPORT_REGEX =
  /import\s+.*?\s+from\s+['"](?:next\/server|next-auth|@prisma\/client|prisma)['"]/g;

const FORBIDDEN_DYNAMIC_IMPORT_REGEX =
  /import\s*\(\s*['"](?:next\/server|next-auth|@prisma\/client|prisma)['"]\s*\)/g;

/**
 * Matches HTTP server instantiation patterns:
 * - express()
 * - fastify()
 * - new Hono()
 * - createServer(
 * - http.createServer(
 * - https.createServer(
 */
const HTTP_SERVER_REGEX =
  /\bexpress\s*\(\s*\)|\bfastify\s*\(\s*\)|\bnew\s+Hono\s*\(|\bcreateServer\s*\(/g;

// --- File Extension Filter ---

const SCANNABLE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

// --- Legacy File Path Patterns ---

function isApiRoute(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return normalized.includes("src/app/api/") || normalized.includes("app/api/");
}

function isNextConfig(relativePath: string): boolean {
  const basename = path.basename(relativePath);
  return /^next\.config\.(ts|js|mjs)$/.test(basename);
}

function isPrismaDir(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts.includes("prisma");
}

function isDatabase(relativePath: string): boolean {
  const ext = path.extname(relativePath).toLowerCase();
  return ext === ".db" || ext === ".sqlite" || ext === ".sqlite3";
}

function isBuildArtifact(relativePath: string): boolean {
  const basename = path.basename(relativePath);
  return basename === "app-paths-manifest.json";
}

function isPostcssConfig(relativePath: string): boolean {
  const basename = path.basename(relativePath);
  return /^postcss\.config\.(mjs|js|cjs|ts)$/.test(basename);
}

// --- Content Scanning ---

/**
 * Scan file content for SSoT violations.
 * This function works with content strings directly for testability.
 */
export function scanFileContent(
  filePath: string,
  content: string,
): SSOTViolation[] {
  const violations: SSOTViolation[] = [];

  // Detect Route Handler exports
  const routeHandlerMatches = content.matchAll(ROUTE_HANDLER_REGEX);
  for (const match of routeHandlerMatches) {
    const method = match[1] || match[2];
    violations.push({
      filePath,
      violationType: "ROUTE_HANDLER",
      detail: `exports ${method} from ${filePath}`,
    });
  }

  // Detect forbidden imports (static)
  const forbiddenImportMatches = content.matchAll(FORBIDDEN_IMPORT_REGEX);
  for (const match of forbiddenImportMatches) {
    const importStatement = match[0];
    const moduleMatch = importStatement.match(
      /['"](?:next\/server|next-auth|@prisma\/client|prisma)['"]/,
    );
    const moduleName = moduleMatch
      ? moduleMatch[0].replace(/['"]/g, "")
      : "unknown";
    violations.push({
      filePath,
      violationType: "FORBIDDEN_IMPORT",
      detail: `imports from '${moduleName}' in ${filePath}`,
    });
  }

  // Detect forbidden imports (dynamic)
  const dynamicImportMatches = content.matchAll(FORBIDDEN_DYNAMIC_IMPORT_REGEX);
  for (const match of dynamicImportMatches) {
    const importStatement = match[0];
    const moduleMatch = importStatement.match(
      /['"](?:next\/server|next-auth|@prisma\/client|prisma)['"]/,
    );
    const moduleName = moduleMatch
      ? moduleMatch[0].replace(/['"]/g, "")
      : "unknown";
    violations.push({
      filePath,
      violationType: "FORBIDDEN_IMPORT",
      detail: `dynamic import of '${moduleName}' in ${filePath}`,
    });
  }

  // Detect HTTP server instantiation
  const httpServerMatches = content.matchAll(HTTP_SERVER_REGEX);
  for (const match of httpServerMatches) {
    const pattern = match[0].trim();
    violations.push({
      filePath,
      violationType: "HTTP_SERVER",
      detail: `HTTP server pattern '${pattern}' in ${filePath}`,
    });
  }

  return violations;
}

// --- Recursive File Discovery ---

/**
 * Recursively collect all files from a directory.
 */
function collectFiles(dirPath: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

// --- Main Scanner ---

/**
 * Scan a mobile workspace directory for SSoT violations and legacy files.
 *
 * @param baseDir - The mobile workspace root directory (e.g., apps/mobile/)
 * @returns ScanResult with violations and categorized legacy files
 */
export function scanMobileWorkspace(baseDir: string): ScanResult {
  const violations: SSOTViolation[] = [];
  const legacyFiles: ScanResult["legacyFiles"] = {
    apiRoutes: [],
    nextConfigs: [],
    prismaDir: [],
    databases: [],
    buildArtifacts: [],
    postcssConfigs: [],
  };

  const allFiles = collectFiles(baseDir);

  for (const absolutePath of allFiles) {
    const relativePath = path.relative(baseDir, absolutePath);

    // Categorize legacy files
    if (isApiRoute(relativePath)) {
      legacyFiles.apiRoutes.push(relativePath);
    } else if (isNextConfig(relativePath)) {
      legacyFiles.nextConfigs.push(relativePath);
    } else if (isPrismaDir(relativePath)) {
      legacyFiles.prismaDir.push(relativePath);
    } else if (isDatabase(relativePath)) {
      legacyFiles.databases.push(relativePath);
    } else if (isBuildArtifact(relativePath)) {
      legacyFiles.buildArtifacts.push(relativePath);
    } else if (isPostcssConfig(relativePath)) {
      legacyFiles.postcssConfigs.push(relativePath);
    }

    // Scan scannable files for content violations
    const ext = path.extname(absolutePath).toLowerCase();
    if (SCANNABLE_EXTENSIONS.has(ext)) {
      try {
        const content = fs.readFileSync(absolutePath, "utf-8");
        const fileViolations = scanFileContent(relativePath, content);
        violations.push(...fileViolations);
      } catch {
        // Skip files that can't be read (binary, permission issues, etc.)
      }
    }
  }

  return { violations, legacyFiles };
}

import { describe, expect, it } from "vitest";
import { scanFileContent, scanMobileWorkspace } from "./ssot-scanner";

describe("SSoT Scanner - Smoke Tests", () => {
  describe("scanFileContent", () => {
    it("detects Route Handler exports (async function)", () => {
      const content = `import { NextRequest } from 'next/server';\nexport async function POST(request: NextRequest) { return new Response(); }`;
      const violations = scanFileContent(
        "src/app/api/auth/login/route.ts",
        content,
      );
      const routeHandlers = violations.filter(
        (v) => v.violationType === "ROUTE_HANDLER",
      );
      expect(routeHandlers.length).toBeGreaterThanOrEqual(1);
      expect(routeHandlers[0].detail).toContain("POST");
    });

    it("detects Route Handler exports (const)", () => {
      const content = `export const GET = async () => { return Response.json({}); }`;
      const violations = scanFileContent("src/app/api/data/route.ts", content);
      const routeHandlers = violations.filter(
        (v) => v.violationType === "ROUTE_HANDLER",
      );
      expect(routeHandlers.length).toBe(1);
      expect(routeHandlers[0].detail).toContain("GET");
    });

    it("detects all HTTP methods", () => {
      const methods = [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "HEAD",
        "OPTIONS",
      ];
      for (const method of methods) {
        const content = `export async function ${method}() {}`;
        const violations = scanFileContent("route.ts", content);
        const routeHandlers = violations.filter(
          (v) => v.violationType === "ROUTE_HANDLER",
        );
        expect(routeHandlers.length).toBe(1);
        expect(routeHandlers[0].detail).toContain(method);
      }
    });

    it("detects forbidden imports (next/server)", () => {
      const content = `import { NextRequest, NextResponse } from 'next/server';`;
      const violations = scanFileContent("route.ts", content);
      const imports = violations.filter(
        (v) => v.violationType === "FORBIDDEN_IMPORT",
      );
      expect(imports.length).toBe(1);
      expect(imports[0].detail).toContain("next/server");
    });

    it("detects forbidden imports (next-auth)", () => {
      const content = `import NextAuth from "next-auth";`;
      const violations = scanFileContent("auth.ts", content);
      const imports = violations.filter(
        (v) => v.violationType === "FORBIDDEN_IMPORT",
      );
      expect(imports.length).toBe(1);
      expect(imports[0].detail).toContain("next-auth");
    });

    it("detects forbidden imports (@prisma/client)", () => {
      const content = `import { PrismaClient } from '@prisma/client';`;
      const violations = scanFileContent("db.ts", content);
      const imports = violations.filter(
        (v) => v.violationType === "FORBIDDEN_IMPORT",
      );
      expect(imports.length).toBe(1);
      expect(imports[0].detail).toContain("@prisma/client");
    });

    it("detects forbidden imports (prisma)", () => {
      const content = `import { prisma } from 'prisma';`;
      const violations = scanFileContent("db.ts", content);
      const imports = violations.filter(
        (v) => v.violationType === "FORBIDDEN_IMPORT",
      );
      expect(imports.length).toBe(1);
      expect(imports[0].detail).toContain("prisma");
    });

    it("detects dynamic imports of forbidden modules", () => {
      const content = `const mod = await import('next/server');`;
      const violations = scanFileContent("dynamic.ts", content);
      const imports = violations.filter(
        (v) => v.violationType === "FORBIDDEN_IMPORT",
      );
      expect(imports.length).toBe(1);
      expect(imports[0].detail).toContain("next/server");
    });

    it("detects HTTP server patterns (express)", () => {
      const content = `const app = express();`;
      const violations = scanFileContent("server.ts", content);
      const servers = violations.filter(
        (v) => v.violationType === "HTTP_SERVER",
      );
      expect(servers.length).toBe(1);
      expect(servers[0].detail).toContain("express()");
    });

    it("detects HTTP server patterns (fastify)", () => {
      const content = `const server = fastify();`;
      const violations = scanFileContent("server.ts", content);
      const servers = violations.filter(
        (v) => v.violationType === "HTTP_SERVER",
      );
      expect(servers.length).toBe(1);
      expect(servers[0].detail).toContain("fastify()");
    });

    it("detects HTTP server patterns (Hono)", () => {
      const content = `const app = new Hono();`;
      const violations = scanFileContent("server.ts", content);
      const servers = violations.filter(
        (v) => v.violationType === "HTTP_SERVER",
      );
      expect(servers.length).toBe(1);
      expect(servers[0].detail).toContain("new Hono(");
    });

    it("detects HTTP server patterns (createServer)", () => {
      const content = `const server = http.createServer(app);`;
      const violations = scanFileContent("server.ts", content);
      const servers = violations.filter(
        (v) => v.violationType === "HTTP_SERVER",
      );
      expect(servers.length).toBe(1);
      expect(servers[0].detail).toContain("createServer(");
    });

    it("returns empty array for clean files", () => {
      const content = `import { View, Text } from 'react-native';\nexport default function Home() { return <View><Text>Hello</Text></View>; }`;
      const violations = scanFileContent("app/index.tsx", content);
      expect(violations).toHaveLength(0);
    });

    it("detects multiple violations in a single file", () => {
      const content = `import { NextRequest, NextResponse } from 'next/server';\nimport { PrismaClient } from '@prisma/client';\nexport async function GET() { return NextResponse.json({}); }\nexport async function POST() { return NextResponse.json({}); }`;
      const violations = scanFileContent("src/app/api/data/route.ts", content);
      expect(violations.length).toBeGreaterThanOrEqual(4); // 2 imports + 2 route handlers
    });
  });

  describe("scanMobileWorkspace", () => {
    it("scans the actual apps/mobile directory and finds no violations (post-purge)", () => {
      const result = scanMobileWorkspace(
        "c:\\LibLogKiro\\LibLogApp\\apps\\mobile",
      );
      // After the backend purge (task 4), the mobile workspace should be clean
      expect(result.violations.length).toBe(0);
      expect(result.legacyFiles.apiRoutes.length).toBe(0);
    });

    it("finds no build artifacts after purge (app-paths-manifest.json removed)", () => {
      const result = scanMobileWorkspace(
        "c:\\LibLogKiro\\LibLogApp\\apps\\mobile",
      );
      expect(result.legacyFiles.buildArtifacts.length).toBe(0);
    });

    it("finds no postcss configs after purge (postcss.config.mjs removed)", () => {
      const result = scanMobileWorkspace(
        "c:\\LibLogKiro\\LibLogApp\\apps\\mobile",
      );
      expect(result.legacyFiles.postcssConfigs.length).toBe(0);
    });
  });
});

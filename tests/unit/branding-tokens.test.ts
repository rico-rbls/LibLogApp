import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const TAILWIND_CONFIG_PATH = path.join(
  WORKSPACE_ROOT,
  "apps/mobile/tailwind.config.ts",
);
const GLOBAL_CSS_PATH = path.join(WORKSPACE_ROOT, "apps/mobile/global.css");

describe("Branding Token Values", () => {
  const tailwindContent = fs.readFileSync(TAILWIND_CONFIG_PATH, "utf-8");
  const globalCssContent = fs.readFileSync(GLOBAL_CSS_PATH, "utf-8");

  describe("Lib_Purple_Palette (10 shades) — Requirements 6.1, 6.2", () => {
    const expectedPalette: Record<string, string> = {
      "50": "#F5EDF9",
      "100": "#E8D5F3",
      "200": "#D4ADE7",
      "300": "#B87DD4",
      "400": "#9B5BBF",
      "500": "#652D90",
      "600": "#5A2880",
      "700": "#4A2068",
      "800": "#3A1850",
      "900": "#2A1038",
    };

    for (const [shade, hex] of Object.entries(expectedPalette)) {
      it(`lib-purple-${shade} equals ${hex}`, () => {
        const pattern = new RegExp(
          `${shade}\\s*:\\s*["']${hex.replace("#", "#")}["']`,
          "i",
        );
        expect(tailwindContent).toMatch(pattern);
      });
    }

    it("DEFAULT lib-purple equals #652D90", () => {
      const pattern = /DEFAULT\s*:\s*["']#652D90["']/i;
      expect(tailwindContent).toMatch(pattern);
    });
  });

  describe("CSS variable --background light/dark — Requirement 6.3", () => {
    it("--background light mode is #f2f2fa", () => {
      // Match within :root block
      const rootBlock = globalCssContent.match(/:root\s*\{([^}]*)\}/s);
      expect(rootBlock).not.toBeNull();
      expect(rootBlock![1]).toMatch(/--background\s*:\s*#f2f2fa/i);
    });

    it("--background dark mode is #110a1e", () => {
      // Match within .dark block
      const darkBlock = globalCssContent.match(/\.dark\s*\{([^}]*)\}/s);
      expect(darkBlock).not.toBeNull();
      expect(darkBlock![1]).toMatch(/--background\s*:\s*#110a1e/i);
    });
  });

  describe("CSS variable --primary and --primary-foreground — Requirement 6.7", () => {
    it("--primary is #652d90", () => {
      const rootBlock = globalCssContent.match(/:root\s*\{([^}]*)\}/s);
      expect(rootBlock).not.toBeNull();
      expect(rootBlock![1]).toMatch(/--primary\s*:\s*#652d90/i);
    });

    it("--primary-foreground is #ffffff", () => {
      const rootBlock = globalCssContent.match(/:root\s*\{([^}]*)\}/s);
      expect(rootBlock).not.toBeNull();
      expect(rootBlock![1]).toMatch(/--primary-foreground\s*:\s*#ffffff/i);
    });
  });

  describe("Border radius tokens — Requirement 6.1 (geometry)", () => {
    it("3xl border radius is 24px", () => {
      const pattern = /["']3xl["']\s*:\s*["']24px["']/;
      expect(tailwindContent).toMatch(pattern);
    });

    it("2xl border radius is 16px", () => {
      const pattern = /["']2xl["']\s*:\s*["']16px["']/;
      expect(tailwindContent).toMatch(pattern);
    });

    it("xl border radius is 12px", () => {
      const pattern = /xl\s*:\s*["']12px["']/;
      expect(tailwindContent).toMatch(pattern);
    });
  });
});

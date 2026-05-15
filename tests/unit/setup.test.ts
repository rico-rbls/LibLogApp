import fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("Test infrastructure", () => {
  it("vitest runs unit tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("fast-check is available for property-based testing", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 10 },
    );
  });
});

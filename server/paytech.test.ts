import { describe, expect, it } from "vitest";

describe("PayTech configuration", () => {
  it("should have PAYTECH_API_KEY set", () => {
    const key = process.env.PAYTECH_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should have PAYTECH_SECRET_KEY set", () => {
    const secret = process.env.PAYTECH_SECRET_KEY;
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    expect(typeof secret).toBe("string");
    expect(secret!.length).toBeGreaterThan(10);
  });
});

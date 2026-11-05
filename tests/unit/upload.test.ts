import { describe, expect, it } from "vitest";
import { detectImage } from "@/server/storage/validate";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(20).fill(0)]);

describe("upload type detection", () => {
  it("recognises real image files by their first bytes", () => {
    expect(detectImage(bytes(0xff, 0xd8, 0xff), false)).toBe("jpg");
    expect(detectImage(bytes(0x89, 0x50, 0x4e, 0x47), false)).toBe("png");
    const webp = new TextEncoder().encode("RIFF____WEBPVP8 ________");
    expect(detectImage(webp, false)).toBe("webp");
  });
  it("rejects other files, and SVG unless allowed", () => {
    expect(detectImage(new TextEncoder().encode("<html><script>"), true)).toBeNull();
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(detectImage(svg, false)).toBeNull();
    expect(detectImage(svg, true)).toBe("svg");
  });
});

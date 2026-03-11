import { describe, expect, it } from "vitest";

export default function(parseRange: typeof import("@ublitzjs/core").parseRange) {

  describe("parseRange", () => {
    const maxEnd = 1000;
    const maxChunk = 100;
    describe("valid ranges", () => {
      it("parses a normal start-end range", () => {
        const res = parseRange("bytes=0-10", maxEnd, maxChunk);
        expect(res).toEqual({ ok: true, start: 0, end: 10 });
      });

      describe("parses range with only start (applies maxChunk)", () => {
        const res = parseRange("bytes=10-", maxEnd, maxChunk);
        expect(res).toEqual({ ok: true, start: 10, end: 110 });
        it("caps end at maxEnd when using maxChunk", () => {
          const res = parseRange("bytes=950-", maxEnd, maxChunk);
          expect(res).toEqual({ ok: true, start: 950, end: 1000 });
        });

        it("parses suffix range", () => {
          const res = parseRange("bytes=-100", maxEnd, maxChunk);
          expect(res).toEqual({ ok: true, start: 900, end: 1000 });
        });

        it("handles no maxChunk (extends to maxEnd)", () => {
          const res = parseRange("bytes=10-", maxEnd, 0);
          expect(res).toEqual({ ok: true, start: 10, end: 1000 });
        });
      });
      describe("400 bad request cases", () => {
        it("rejects ranges not starting with bytes=", () => {
          const res = parseRange("items=0-10", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "400" });
        });

        it("rejects missing dash", () => {
          const res = parseRange("bytes=100", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "400" });
        });

        it("rejects NaN start", () => {
          const res = parseRange("bytes=abc-10", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "400" });
        });

        it("rejects NaN end", () => {
          const res = parseRange("bytes=0-xyz", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "400" });
        });

        it("rejects too short range string", () => {
          const res = parseRange("bytes=", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "400" });
        });
      });

      describe("416 unsatisfiable ranges", () => {
        it("rejects start >= end", () => {
          const res = parseRange("bytes=100-50", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "416" });
        });

        it("rejects start >= maxEnd", () => {
          const res = parseRange("bytes=1000-1100", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "416" });
        });

        it("rejects empty range", () => {
          const res = parseRange("bytes=10-10", maxEnd, maxChunk);
          expect(res).toEqual({ ok: false, code: "416" });
        });
      });
    });
  })
}

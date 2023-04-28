import { describe, it, beforeAll, expect } from "vitest";
import { BruteforceSearch } from "../src/lib/bruteforce";
import type { Vector } from "../src/types";
describe("BruteforceSearch", () => {
  describe("#constructor", () => {
    it("throws an error if no arguments are given", () => {
      expect(() => {
        // @ts-ignore
        new BruteforceSearch();
      }).toThrow();
    });

    it("throws an error if given a non-String object to first argument", () => {
      expect(() => {
        // @ts-ignore
        new BruteforceSearch(1, 3);
      }).toThrow();
    });

    it("throws an error if given a non-Number object to second argument", () => {
      expect(() => {
        // @ts-ignore
        new BruteforceSearch("l2", "3");
      }).toThrow();
    });

    it('throws an error if given a String that is neither "l2", "ip" nor "cosine" to first argument', () => {
      expect(() => {
        // @ts-ignore
        new BruteforceSearch("cos", 3);
      }).toThrow();
    });
  });

  describe("#getCurrentCount", () => {
    const index = new BruteforceSearch("l2", 3);

    it("returns 0 if called before the index is initialized", () => {
      expect(index.getCurrentCount()).toBe(0);
    });

    it("returns current number of elements", () => {
      index.addPoint([1, 2, 3], 0);
      index.addPoint([2, 3, 4], 1);
      expect(index.getCurrentCount()).toBe(2);
    });
  });

  describe("#getNumDimensions", () => {
    const index = new BruteforceSearch("l2", 3);

    it("returns number of dimensions", () => {
      expect(index.getNumDimensions()).toBe(3);
    });
  });

  describe("#removePoint", () => {
    const index = new BruteforceSearch("l2", 3);

    it("removes the element specified by index", () => {
      index.addPoint([1, 2, 3], 0);
      index.addPoint([1, 2, 4], 1);
      expect(index.getCurrentCount()).toBe(2);
      index.removePoint(1);
      expect(index.getCurrentCount()).toBe(1);
      expect(index.searchKnn([1, 2, 4], 1)[0].label).toEqual(0);
    });
  });

  describe("#searchKnn", () => {
    describe('when metric space is "l2"', () => {
      const index = new BruteforceSearch("l2", 3);

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([2, 3, 4], 1);
        index.addPoint([3, 4, 5], 2);
      });

      it("returns search results based on squared Euclidean distance", () => {
        expect(index.searchKnn([1, 2, 5], 2)).toMatchObject([
          { label: 1, score: 3 },
          { label: 0, score: 4 },
        ]);
      });
    });

    describe('when metric space is "ip"', () => {
      const index = new BruteforceSearch("ip", 3);

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([2, 3, 4], 1);
        index.addPoint([3, 4, 5], 2);
      });

      it("returns search results based on one minus inner product", () => {
        expect(index.searchKnn([1, 2, 5], 2)).toMatchObject([
          { label: 2, score: -35 },
          { label: 1, score: -27 },
        ]);
      });
    });

    describe('when metric space is "cosine"', () => {
      const index = new BruteforceSearch("cosine", 3);

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([2, 3, 4], 1);
        index.addPoint([3, 4, 5], 2);
      });

      it("returns search results based on one minus cosine similarity", () => {
        const res = index.searchKnn([1, 2, 5], 2);
        expect(res.map((l) => l.label)).toMatchObject([0, 1]);
        expect(res[0].score).toBeCloseTo(1.0 - 20.0 / (Math.sqrt(14) * Math.sqrt(30)), 6);
        expect(res[1].score).toBeCloseTo(1.0 - 28.0 / (Math.sqrt(29) * Math.sqrt(30)), 6);
      });
    });

    describe("when filter function is given", () => {
      const index = new BruteforceSearch<Vector, number>("l2", 3);
      const filter = (label: number) => label % 2 == 0;

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([1, 2, 5], 1);
        index.addPoint([1, 2, 4], 2);
        index.addPoint([1, 2, 5], 3);
      });

      it("returns filtered search results", () => {
        expect(index.searchKnn([1, 2, 5], 4, filter)).toMatchObject([
          { label: 2, score: 1 },
          { label: 0, score: 4 },
        ]);
      });
    });
  });
});

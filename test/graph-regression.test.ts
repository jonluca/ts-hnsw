import { afterEach, describe, expect, it, vi } from "vitest";
import { HNSW, BruteforceSearch, L2Space, InnerProductSpace, CosineSpace } from "../src";

afterEach(() => vi.restoreAllMocks());

describe("HNSW graph connectivity", () => {
  it.each(["l2", "ip", "cosine"] as const)("matches exhaustive search across deterministic levels for %s", (metric) => {
    let state = 123456789;
    vi.spyOn(Math, "random").mockImplementation(() => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    });
    const index = new HNSW(metric, 3, 16, 100);
    const exhaustive = new BruteforceSearch(metric, 3);
    for (let label = 0; label < 50; label++) {
      const point = [Math.random(), Math.random(), Math.random()];
      index.addPoint(point, label);
      exhaustive.addPoint(point, label);
    }
    for (let query = 0; query < 20; query++) {
      const point = [Math.random(), Math.random(), Math.random()];
      expect(index.searchKnn(point, 5)).toEqual(exhaustive.searchKnn(point, 5));
    }
  });

  it("returns only active heap entries when the search candidate limit is reached", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.75);
    const index = new HNSW("l2", 1, 16, 10);
    const exhaustive = new BruteforceSearch("l2", 1);
    for (let label = 0; label < 20; label++) {
      index.addPoint([label], label);
      exhaustive.addPoint([label], label);
    }
    const results = index.searchKnn([19], 5);
    expect(results).toEqual(exhaustive.searchKnn([19], 5));
    expect(new Set(results.map((result) => result.label)).size).toBe(5);
  });

  it("keeps the graph unchanged after a duplicate label is rejected", () => {
    const index = new HNSW("l2", 2);
    index.addPoint([1, 2], "point");
    expect(() => index.addPoint([3, 4], "point")).toThrow("already exists");
    expect(index.getCurrentCount()).toBe(1);
    expect(index.searchKnn([1, 2], 1)).toEqual([{ label: "point", score: 0 }]);
  });
});

describe("public distance methods", () => {
  it.each([L2Space, InnerProductSpace, CosineSpace])(
    "accepts typed vectors and rejects invalid dimensions and values",
    (Space) => {
      const space = new Space(2);
      expect(Number.isFinite(space.distance(new Float32Array([1, 2]), new Uint8Array([1, 2])))).toBe(true);
      expect(() => new Space(0)).toThrow("positive integer");
      expect(() => new Space(1.5)).toThrow("positive integer");
      expect(() => space.distance([1, Number.NaN], [1, 2])).toThrow("finite numbers");
    },
  );
});

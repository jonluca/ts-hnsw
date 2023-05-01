import { describe, it, expect, beforeAll } from "vitest";
import type { Vector } from "../src";
import { HNSW as HierarchicalNSW } from "../src";

describe("HierarchicalNSW", () => {
  describe("#constructor", () => {
    it("throws an error if no arguments are given", () => {
      expect(() => {
        // @ts-ignore
        new HierarchicalNSW();
      }).toThrow();
    });

    it("throws an error if given a non-String object to first argument", () => {
      expect(() => {
        // @ts-ignore
        new HierarchicalNSW(1, 3);
      }).toThrow();
    });

    it("throws an error if given a non-Number object to second argument", () => {
      expect(() => {
        // @ts-ignore
        new HierarchicalNSW("l2", "3");
      }).toThrow();
    });

    it('throws an error if given a String that is neither "l2", "ip", nor "cosine" to first argument', () => {
      expect(() => {
        // @ts-ignore
        new HierarchicalNSW("cos", 3);
      }).toThrow();
    });
  });

  describe("#getIdsList", () => {
    const index = new HierarchicalNSW("l2", 3);

    it("returns an empty array if called before the index is initialized", () => {
      expect(index.getIdsList()).toMatchObject([]);
    });

    it("returns an array consists of label id", () => {
      index.addPoint([1, 2, 3], 0);
      index.addPoint([2, 3, 4], 1);
      expect(index.getIdsList()).toEqual([1, 0]);
    });
  });

  describe("#getPoint", () => {
    const index = new HierarchicalNSW("l2", 3);

    describe("when the index has some data points", () => {
      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([2, 3, 4], 1);
        index.addPoint([3, 4, 5], 2);
      });

      it("returns stored datum point", () => {
        expect(index.getPoint(0)).toMatchObject([1, 2, 3]);
        expect(index.getPoint(1)).toMatchObject([2, 3, 4]);
        expect(index.getPoint(2)).toMatchObject([3, 4, 5]);
      });
    });
  });

  describe("#getCurrentCount", () => {
    const index = new HierarchicalNSW("l2", 3);

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
    const index = new HierarchicalNSW("l2", 3);

    it("returns number of dimensions", () => {
      expect(index.getNumDimensions()).toBe(3);
    });
  });

  describe("#getEf", () => {
    const index = new HierarchicalNSW("l2", 3);

    it("returns ef parameter value", () => {
      expect(index.getEf()).toBe(10);
    });
  });

  describe("#setEf", () => {
    const index = new HierarchicalNSW("l2", 3);

    it("throws an error if no arguments are given", () => {
      expect(() => {
        // @ts-ignore
        index.setEf();
      }).toThrow();
    });

    it("throws an error if given a non-Number argument", () => {
      expect(() => {
        // @ts-ignore
        index.setEf("0");
      }).toThrow();
    });

    it("sets ef parameter value", () => {
      index.setEf(123);
      expect(index.getEf()).toBe(123);
    });
  });

  describe("#addPoint", () => {
    const index = new HierarchicalNSW("l2", 3);

    it("throws an error if no arguments are given", () => {
      expect(() => {
        // @ts-ignore
        index.addPoint();
      }).toThrow();
    });

    it("throws an error if given a non-Array object to first argument", () => {
      expect(() => {
        // @ts-ignore
        index.addPoint("[1, 2, 3]", 0);
      }).toThrow();
    });

    it("throws an error if given an array with a length different from the number of dimensions", () => {
      expect(() => {
        index.addPoint([1, 2, 3, 4, 5], 0);
      }).toThrow();
    });

    it("throws an error if more element is added than the maximum number of elements.", () => {
      index.addPoint([1, 2, 3], 0);
      expect(() => {
        index.addPoint([1, 2, 3], 1);
      }).toThrow(/Hnswlib Error/);
    });
  });

  describe("#searchKnn", () => {
    describe('when metric space is "l2"', () => {
      const index = new HierarchicalNSW("l2", 3);

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([2, 3, 4], 1);
        index.addPoint([3, 4, 5], 2);
      });

      it("throws an error if no arguments are given", () => {
        expect(() => {
          // @ts-ignore
          index.searchKnn();
        }).toThrow();
      });

      it("throws an error if given a non-Array object to first argument", () => {
        expect(() => {
          // @ts-ignore
          index.searchKnn("[1, 2, 3]", 2);
        }).toThrow();
      });

      it("throws an error if given a non-Number object to second argument", () => {
        expect(() => {
          // @ts-ignore
          index.searchKnn([1, 2, 3], "2");
        }).toThrow();
      });

      it("throws an error if given a non-Function to third argument", () => {
        expect(() => {
          // @ts-ignore
          index.searchKnn([1, 2, 3], 2, "fnc");
        }).toThrow();
      });

      it("throws an error if given the number of neighborhoods exceeding the maximum number of elements", () => {
        expect(() => {
          index.searchKnn([1, 2, 5], 4);
        }).toThrow(
          "Invalid the number of k-nearest neighbors (cannot be given a value greater than `maxElements`: 3).",
        );
      });

      it("throws an error if given an array with a length different from the number of dimensions", () => {
        expect(() => {
          index.searchKnn([1, 2, 5, 4], 2);
        }).toThrow();
      });

      it("returns search results based on squared Euclidean distance", () => {
        expect(index.searchKnn([1, 2, 5], 2)).toMatchObject({ distances: [3, 4], neighbors: [1, 0] });
      });
    });

    describe('when metric space is "ip"', () => {
      const index = new HierarchicalNSW("ip", 3);

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([2, 3, 4], 1);
        index.addPoint([3, 4, 5], 2);
      });

      it("returns search results based on one minus inner product", () => {
        expect(index.searchKnn([1, 2, 5], 2)).toMatchObject({ distances: [-35, -27], neighbors: [2, 1] });
      });
    });

    describe('when metric space is "cosine"', () => {
      const index = new HierarchicalNSW("cosine", 3);

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
      const index = new HierarchicalNSW<Vector, number>("l2", 3);
      const filter = (label: number) => label % 2 == 0;

      beforeAll(() => {
        index.addPoint([1, 2, 3], 0);
        index.addPoint([1, 2, 5], 1);
        index.addPoint([1, 2, 4], 2);
        index.addPoint([1, 2, 5], 3);
      });

      it("returns filtered search results", () => {
        expect(index.searchKnn([1, 2, 5], 4, filter)).toMatchObject({ distances: [1, 4], neighbors: [2, 0] });
      });
    });
  });
});

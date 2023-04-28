import type { SpaceInterface, AlgorithmInterface } from "./hnswlib";
import type { VectorLabelType } from "./hnswlib";
import type { Vector } from "../types";
import type { SpaceName } from "../index";
import { InnerProductSpace, L2Space } from "./hnswlib";
import FastPriorityQueue from "./fpq";
import { CosineSpace } from "./space_cosine";

export class BruteforceSearch<T extends Vector = Vector, LabelType extends VectorLabelType = VectorLabelType>
  implements AlgorithmInterface<T, LabelType>
{
  private data: Map<LabelType, T>;
  private space: SpaceInterface;

  constructor(spaceName: SpaceName, numDimensions: number) {
    if (!spaceName || !numDimensions) {
      throw new Error("Space name and number of dimensions required");
    }

    if (Number.isNaN(numDimensions) || typeof numDimensions !== "number") {
      throw new Error("Number of dimensions must be a number");
    }
    if (spaceName !== "l2" && spaceName !== "ip" && spaceName !== "cosine") {
      throw new Error("Space name must be either 'l2' or 'ip'");
    }
    if (spaceName === "l2") {
      this.space = new L2Space(numDimensions);
    } else if (spaceName === "cosine") {
      this.space = new CosineSpace(numDimensions);
    } else {
      this.space = new InnerProductSpace(numDimensions);
    }
    this.data = new Map<LabelType, T>();
  }

  addPoint(datapoint: T, label: LabelType): void {
    this.data.set(label, datapoint);
  }

  removePoint(key: LabelType): void {
    this.data.delete(key);
  }

  searchKnn(vector: T, k: number, filter?: (label: LabelType) => boolean) {
    const topResults = new FastPriorityQueue<[LabelType, number]>((_a, _b) => {
      const a = _a[1];
      const b = _b[1];
      return b > a;
    });
    if (this.data.size === 0) {
      return [];
    }
    const distFunc = this.space.getDistanceFunction();
    for (const [key, val] of this.data.entries()) {
      topResults.add([key, distFunc(vector, val)]);
    }

    const results = [];
    while (results.length < k && topResults.size > 0) {
      const poll = topResults.poll()!;
      if (filter && !filter(poll[0])) {
        continue;
      }
      results.push(poll!);
    }
    const res = results.map(([id, value]) => ({ label: id, score: value }));
    return res;
  }

  saveIndex(location: string): void {
    //todo - seralize self
  }

  loadIndex(location: string): void {
    // todo - deserialize self
  }

  getCurrentCount(): number {
    return this.data.size;
  }
  getNumDimensions(): number {
    return this.space.getDataSize();
  }
}

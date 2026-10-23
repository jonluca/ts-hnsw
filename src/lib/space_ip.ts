import type { Vector } from "../types";
import type { DistFunc } from "../types";

export class InnerProductSpace {
  private data_size: number;
  private dim: number;

  constructor(dim: number) {
    this.dim = dim;
    this.data_size = dim;
  }

  getDataSize(): number {
    return this.data_size;
  }

  getDistanceFunction(): DistFunc {
    return InnerProductSpace.innerProductDistance;
  }

  getDistanceFunctionParam(): number {
    return this.dim;
  }

  static innerProduct(pVect1: Vector, pVect2: Vector): number {
    const qty: number = pVect1.length as number;
    let res = 0;
    for (let i = 0; i < qty; i++) {
      res += pVect1[i] * pVect2[i];
    }
    return res;
  }

  static innerProductDistance(pVect1: Vector, pVect2: Vector): number {
    return 1.0 - InnerProductSpace.innerProduct(pVect1, pVect2);
  }
}

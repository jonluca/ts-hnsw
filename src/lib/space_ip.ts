import { validateDimensions, validateDistance } from "./validation";
import type { Vector } from "../types";
import type { DistFunc } from "../types";

export class InnerProductSpace {
  private data_size: number;
  private dim: number;

  constructor(dim: number) {
    validateDimensions(dim, arguments.length);
    this.dim = dim;
    this.data_size = dim;
  }

  getNumDimensions(): number {
    return this.dim;
  }

  distance(first: Vector, second: Vector): number {
    validateDistance(first, second, this.dim, arguments.length);
    return InnerProductSpace.innerProductDistance(first, second);
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

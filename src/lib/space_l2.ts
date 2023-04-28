import type { Vector } from "../types";
import type { SpaceInterface } from "./hnswlib";

export function L2Sqr(pVect1v: Vector, pVect2v: Vector): number {
  const pVect1 = pVect1v;
  const pVect2 = pVect2v;
  let res = 0;
  const qty = pVect1.length;
  for (let i = 0; i < qty; i++) {
    const t = pVect1[i] - pVect2[i];
    res += Math.pow(t, 2);
  }
  return res;
}

export class L2Space implements SpaceInterface {
  private readonly dataSize: number;
  private readonly _dim: number;

  constructor(dim: number) {
    this._dim = dim;
    this.dataSize = dim;
  }

  getDataSize() {
    return this.dataSize;
  }

  getDistanceFunction() {
    return L2Sqr;
  }

  getDistanceFunctionParam() {
    return this._dim;
  }
}

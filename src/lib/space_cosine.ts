import { validateDimensions, validateDistance } from "./validation";
import type { Vector } from "../types";
import type { SpaceInterface } from "./hnswlib";

export class CosineSpace implements SpaceInterface {
  private readonly dataSize: number;
  private readonly _dim: number;

  constructor(dim: number) {
    validateDimensions(dim, arguments.length);
    this._dim = dim;
    this.dataSize = dim;
  }

  getNumDimensions(): number {
    return this._dim;
  }

  distance(first: Vector, second: Vector): number {
    validateDistance(first, second, this._dim, arguments.length);
    return CosineSpace.inverseCosineSimilarity(first, second);
  }

  getDataSize() {
    return this.dataSize;
  }

  getDistanceFunction() {
    return CosineSpace.inverseCosineSimilarity;
  }

  getDistanceFunctionParam() {
    return this._dim;
  }

  static cosineSimilarity(vectorA: Vector, vectorB: Vector) {
    const dimensionality = Math.min(vectorA.length, vectorB.length);
    let dotAB = 0;
    let dotA = 0;
    let dotB = 0;
    let dimension = 0;
    while (dimension < dimensionality) {
      const componentA = vectorA[dimension];
      const componentB = vectorB[dimension];
      dotAB += componentA * componentB;
      dotA += componentA * componentA;
      dotB += componentB * componentB;
      dimension += 1;
    }

    const magnitude = Math.sqrt(dotA * dotB);
    if (magnitude === 0) {
      return 0;
    }
    return dotAB / magnitude;
  }

  static inverseCosineSimilarity(vectorA: Vector, vectorB: Vector) {
    return 1.0 - CosineSpace.cosineSimilarity(vectorA, vectorB);
  }
}

import type { DistFunc, SpaceInterface, SpaceName } from "../index";
import { CosineSpace, InnerProductSpace, L2Space } from "../index";

export class BaseAlgorithm {
  space: SpaceInterface;

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
  }

  getNumDimensions(): number {
    return this.space.getDataSize();
  }

  getDistanceFunction(): DistFunc {
    return this.space.getDistanceFunction();
  }

  getDistanceFunctionParam(): number {
    return this.space.getDistanceFunctionParam();
  }
}

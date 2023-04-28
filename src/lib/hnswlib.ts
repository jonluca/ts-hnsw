import type { DistFunc } from "../types";

export type VectorLabelType = number | string;

export abstract class SpaceInterface {
  abstract getDataSize(): number;
  abstract getDistanceFunction(): DistFunc;
  abstract getDistanceFunctionParam(): any;
}

interface SearchResult {
  label: VectorLabelType;
  score: number;
}
export abstract class AlgorithmInterface<DistType, LabelType extends VectorLabelType = VectorLabelType> {
  abstract addPoint(datapoint: DistType, label: VectorLabelType): void;
  abstract searchKnn(queryPoint: DistType, size: number, filter?: (label: LabelType) => boolean): Array<SearchResult>;
  abstract saveIndex(location: string): void;
}

export * from "./space_l2";
export * from "./space_ip";
export * from "./bruteforce";
export * from "./hnswalg";

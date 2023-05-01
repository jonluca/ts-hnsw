import { FastPriorityQueue } from "./fpq";
import type { Vector } from "../types";
import type { AlgorithmInterface } from "./hnswlib";
import type { VectorLabelType } from "./hnswlib";
import type { SpaceName } from "../index";
import { BaseAlgorithm } from "./baseAlgorithm"; // Install via: npm install fastpriorityqueue

class Node<T extends Vector = Vector, LabelType extends VectorLabelType = VectorLabelType> {
  vector: T;
  level: number;
  label: LabelType;
  neighbors: Node<T, LabelType>[][];

  constructor(point: T, label: LabelType, level: number) {
    this.vector = point;
    this.level = level;
    this.label = label;
    this.neighbors = new Array(level + 1);
    for (let i = 0; i <= level; i++) {
      this.neighbors[i] = [];
    }
  }
}

export class HNSW<T extends Vector = Vector, LabelType extends VectorLabelType = VectorLabelType>
  extends BaseAlgorithm
  implements AlgorithmInterface<T>
{
  private entryPoint: Node<T, LabelType> | null;
  private maxLevel: number;
  private M: number;
  private ef: number;
  private count: number;

  private nodeList = new Map<LabelType, T>();
  constructor(spaceName: SpaceName, numDimensions: number, M = 16, ef = 10) {
    super(spaceName, numDimensions);
    this.entryPoint = null;
    this.maxLevel = 0;
    this.M = M;
    this.count = 0;
    this.ef = ef;
  }

  getEf(): number {
    return this.ef;
  }

  getCurrentCount(): number {
    return this.count;
  }

  getPoint(label: LabelType): T | undefined {
    return this.nodeList.get(label);
  }

  getIdsList(): LabelType[] {
    return Array.from(this.nodeList.keys());
  }

  setEf(ef: number): void {
    if (!ef || typeof ef !== "number" || ef < 0) {
      throw new Error(`ef must be a positive number, got ${ef}`);
    }
    this.ef = ef;
  }

  private getRandomLevel(): number {
    let level = 0;
    while (Math.random() < 0.5) {
      level++;
    }
    return level;
  }

  addPoint(point: T, label: LabelType): void {
    const level = this.getRandomLevel();
    const newNode = new Node<T, LabelType>(point, label, level);

    this.nodeList.set(label, point);
    this.count++;
    if (this.entryPoint === null) {
      this.entryPoint = newNode;
      this.maxLevel = level;
      return;
    }

    const closestNode = this.searchLayer(point, this.maxLevel, this.entryPoint);
    this.insert(closestNode, newNode);
    if (level > this.maxLevel) {
      this.maxLevel = level;
    }
  }

  private insert(closestNode: Node<T, LabelType>, newNode: Node<T, LabelType>): void {
    for (let level = newNode.level; level >= 0; level--) {
      const neighbors = this.searchNeighbors(closestNode, newNode.vector, this.ef, level);
      this.link(neighbors, newNode, level);
    }
  }

  private link(neighbors: Node<T, LabelType>[], newNode: Node<T, LabelType>, level: number): void {
    const distFunc = this.getDistanceFunction();

    neighbors.sort((a, b) => distFunc(a.vector, newNode.vector) - distFunc(b.vector, newNode.vector));
    newNode.neighbors[level] = neighbors.slice(0, this.M);
  }

  private searchLayer(queryPoint: Vector, level: number, entryPoint: Node<T, LabelType>): Node<T, LabelType> {
    let currentNode = entryPoint;

    const distFunc = this.getDistanceFunction();
    while (level >= 0) {
      let nextNode: Node<T, LabelType> | null = null;
      let bestDist = Infinity;

      for (const neighbor of currentNode.neighbors[level]) {
        const dist = distFunc(queryPoint, neighbor.vector);
        if (dist < bestDist) {
          nextNode = neighbor;
          bestDist = dist;
        }
      }

      if (nextNode) {
        currentNode = nextNode;
      } else {
        level--;
      }
    }

    return currentNode;
  }

  private searchNeighbors(
    closestNode: Node<T, LabelType>,
    queryPoint: T,
    ef: number,
    level: number,
  ): Node<T, LabelType>[] {
    const distFunc = this.getDistanceFunction();

    const visited = new Set<Node<T, LabelType>>();
    const result = new FastPriorityQueue<Node<T, LabelType>>(
      (a, b) => distFunc(a.vector, queryPoint) < distFunc(b.vector, queryPoint),
    );
    const candidateQueue = new FastPriorityQueue<Node<T, LabelType>>(
      (a, b) => distFunc(b.vector, queryPoint) < distFunc(a.vector, queryPoint),
    );

    visited.add(closestNode);
    candidateQueue.add(closestNode);
    result.add(closestNode);

    while (!candidateQueue.isEmpty()) {
      const candidate = candidateQueue.poll()!;

      for (const neighbor of candidate.neighbors[level]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const distToNeighbor = distFunc(neighbor.vector, queryPoint);
          if (result.size < ef || distToNeighbor < distFunc(result.peek()!.vector, queryPoint)) {
            candidateQueue.add(neighbor);
            result.add(neighbor);
          }
        }
      }
    }

    return result.array;
  }

  searchKnn(queryPoint: T, k: number, filter?: (label: LabelType) => boolean) {
    if (!this.entryPoint) {
      return [];
    }
    const distFunc = this.getDistanceFunction();

    const closestNode = this.searchLayer(queryPoint, this.maxLevel, this.entryPoint);
    let neighbors = this.searchNeighbors(closestNode, queryPoint, this.ef, 0);
    neighbors.sort((a, b) => distFunc(a.vector, queryPoint) - distFunc(b.vector, queryPoint));
    if (filter) {
      neighbors = neighbors.filter((l) => filter(l.label));
    }
    neighbors = neighbors.slice(0, k);
    return neighbors.map((l) => ({
      label: l.label,
      score: distFunc(l.vector, queryPoint),
    }));
  }

  saveIndex(location: string): void {
    //todo - seralize self
  }
}

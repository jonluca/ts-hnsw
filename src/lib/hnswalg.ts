import { validateVector } from "./validation";
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
    if (!Number.isInteger(M) || M < 2) {
      throw new Error("M must be an integer greater than one.");
    }
    if (!Number.isInteger(ef) || ef <= 0) {
      throw new Error("ef must be a positive integer.");
    }
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
    if (!Number.isInteger(ef) || ef <= 0) {
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
    validateVector(point, this.getNumDimensions());
    if (typeof label !== "string" && (typeof label !== "number" || !Number.isFinite(label))) {
      throw new Error("A string or finite number label is required.");
    }
    if (this.nodeList.has(label)) {throw new Error("A point with this label already exists.");}
    const level = this.getRandomLevel();
    const newNode = new Node<T, LabelType>(point, label, level);

    this.nodeList.set(label, point);
    this.count++;
    if (this.entryPoint === null) {
      this.entryPoint = newNode;
      this.maxLevel = level;
      return;
    }

    let closestNode = this.entryPoint;
    for (let layer = this.maxLevel; layer > level; layer--) {
      closestNode = this.searchLayer(point, layer, closestNode);
    }
    for (let layer = Math.min(level, this.maxLevel); layer >= 0; layer--) {
      const neighbors = this.searchNeighbors(closestNode, point, this.ef, layer);
      this.link(neighbors, newNode, layer);
      if (newNode.neighbors[layer].length) {closestNode = newNode.neighbors[layer][0];}
    }
    if (level > this.maxLevel) {
      this.entryPoint = newNode;
      this.maxLevel = level;
    }
  }

  private link(neighbors: Node<T, LabelType>[], newNode: Node<T, LabelType>, level: number): void {
    const distFunc = this.getDistanceFunction();
    neighbors.sort((a, b) => distFunc(a.vector, newNode.vector) - distFunc(b.vector, newNode.vector));
    newNode.neighbors[level] = neighbors.slice(0, this.M);
    for (const neighbor of newNode.neighbors[level]) {
      neighbor.neighbors[level].push(newNode);
      neighbor.neighbors[level].sort(
        (a, b) => distFunc(a.vector, neighbor.vector) - distFunc(b.vector, neighbor.vector),
      );
      neighbor.neighbors[level] = neighbor.neighbors[level].slice(0, this.M);
    }
  }

  private searchLayer(queryPoint: Vector, level: number, entryPoint: Node<T, LabelType>): Node<T, LabelType> {
    let currentNode = entryPoint;
    const distFunc = this.getDistanceFunction();
    let bestDist = distFunc(queryPoint, currentNode.vector);
    let searching = true;
    while (searching) {
      let nextNode = currentNode;
      for (const neighbor of currentNode.neighbors[level]) {
        const dist = distFunc(queryPoint, neighbor.vector);
        if (dist < bestDist) {
          nextNode = neighbor;
          bestDist = dist;
        }
      }
      searching = nextNode !== currentNode;
      currentNode = nextNode;
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
      (a, b) => distFunc(a.vector, queryPoint) > distFunc(b.vector, queryPoint),
    );
    const candidateQueue = new FastPriorityQueue<Node<T, LabelType>>(
      (a, b) => distFunc(a.vector, queryPoint) < distFunc(b.vector, queryPoint),
    );

    visited.add(closestNode);
    candidateQueue.add(closestNode);
    result.add(closestNode);

    while (!candidateQueue.isEmpty()) {
      const candidate = candidateQueue.poll()!;
      if (result.size >= ef && distFunc(candidate.vector, queryPoint) > distFunc(result.peek()!.vector, queryPoint))
        {break;}

      for (const neighbor of candidate.neighbors[level]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const distToNeighbor = distFunc(neighbor.vector, queryPoint);
          if (result.size < ef || distToNeighbor < distFunc(result.peek()!.vector, queryPoint)) {
            candidateQueue.add(neighbor);
            result.add(neighbor);
            if (result.size > ef) {result.poll();}
          }
        }
      }
    }

    return result.array;
  }

  searchKnn(queryPoint: T, k: number, filter?: (label: LabelType) => boolean) {
    validateVector(queryPoint, this.getNumDimensions());
    if (!Number.isInteger(k) || k <= 0) {throw new Error("k must be a positive integer.");}
    if (filter !== undefined && typeof filter !== "function") {throw new Error("Filter must be a function.");}
    if (!this.entryPoint) {
      return [];
    }
    const distFunc = this.getDistanceFunction();

    let closestNode = this.entryPoint;
    for (let layer = this.maxLevel; layer > 0; layer--) {
      closestNode = this.searchLayer(queryPoint, layer, closestNode);
    }
    let neighbors = this.searchNeighbors(closestNode, queryPoint, Math.max(this.ef, k), 0);
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

import { FastPriorityQueue } from "./fpq";
import type { Vector } from "../types";
import type { AlgorithmInterface } from "./hnswlib";
import type { VectorLabelType } from "./hnswlib"; // Install via: npm install fastpriorityqueue

type DistanceFunction = <T extends Vector>(a: T, b: T) => number;

class Node<T extends Vector> {
  vector: T;
  level: number;
  label: VectorLabelType;
  neighbors: Node<T>[][];

  constructor(point: T, label: VectorLabelType, level: number) {
    this.vector = point;
    this.level = level;
    this.label = label;
    this.neighbors = new Array(level + 1);
    for (let i = 0; i <= level; i++) {
      this.neighbors[i] = [];
    }
  }
}

export class HNSW<T extends Vector> implements AlgorithmInterface<T> {
  private distanceFunction: DistanceFunction;
  private entryPoint: Node<T> | null;
  private maxLevel: number;
  private M: number;
  private ef: number;

  constructor(distanceFunction: DistanceFunction, M = 16, ef = 50) {
    this.distanceFunction = distanceFunction;
    this.entryPoint = null;
    this.maxLevel = 0;
    this.M = M;
    this.ef = ef;
  }

  private getRandomLevel(): number {
    let level = 0;
    while (Math.random() < 0.5) {
      level++;
    }
    return level;
  }

  addPoint(point: T, label: VectorLabelType): void {
    const level = this.getRandomLevel();
    const newNode = new Node<T>(point, label, level);

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

  private insert(closestNode: Node<T>, newNode: Node<T>): void {
    for (let level = newNode.level; level >= 0; level--) {
      const neighbors = this.searchNeighbors(closestNode, newNode.vector, this.ef, level);
      this.link(neighbors, newNode, level);
    }
  }

  private link(neighbors: Node<T>[], newNode: Node<T>, level: number): void {
    neighbors.sort(
      (a, b) => this.distanceFunction(a.vector, newNode.vector) - this.distanceFunction(b.vector, newNode.vector),
    );
    newNode.neighbors[level] = neighbors.slice(0, this.M);
  }

  private searchLayer(queryPoint: Vector, level: number, entryPoint: Node<T>): Node<T> {
    let currentNode = entryPoint;

    while (level >= 0) {
      let nextNode: Node<T> | null = null;
      let bestDist = Infinity;

      for (const neighbor of currentNode.neighbors[level]) {
        const dist = this.distanceFunction(queryPoint, neighbor.vector);
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

  private searchNeighbors(closestNode: Node<T>, queryPoint: T, ef: number, level: number): Node<T>[] {
    const visited = new Set<Node<T>>();
    const result = new FastPriorityQueue<Node<T>>(
      (a, b) => this.distanceFunction(a.vector, queryPoint) < this.distanceFunction(b.vector, queryPoint),
    );
    const candidateQueue = new FastPriorityQueue<Node<T>>(
      (a, b) => this.distanceFunction(b.vector, queryPoint) < this.distanceFunction(a.vector, queryPoint),
    );

    visited.add(closestNode);
    candidateQueue.add(closestNode);
    result.add(closestNode);

    while (!candidateQueue.isEmpty()) {
      const candidate = candidateQueue.poll()!;

      for (const neighbor of candidate.neighbors[level]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const distToNeighbor = this.distanceFunction(neighbor.vector, queryPoint);
          if (result.size < ef || distToNeighbor < this.distanceFunction(result.peek()!.vector, queryPoint)) {
            candidateQueue.add(neighbor);
            result.add(neighbor);
          }
        }
      }
    }

    return result.array;
  }

  searchKnn(queryPoint: T, k: number) {
    if (!this.entryPoint) {
      return [];
    }
    const closestNode = this.searchLayer(queryPoint, this.maxLevel, this.entryPoint);
    const neighbors = this.searchNeighbors(closestNode, queryPoint, this.ef, 0);
    neighbors.sort((a, b) => this.distanceFunction(a.vector, queryPoint) - this.distanceFunction(b.vector, queryPoint));
    return neighbors.slice(0, k).map((l) => ({
      label: l.label,
      score: this.distanceFunction(l.vector, queryPoint),
    }));
  }

  saveIndex(location: string): void {
    //todo - seralize self
  }
}

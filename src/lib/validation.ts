import type { Vector } from "../types";

export function validateDimensions(dim: number, argumentCount: number): void {
  if (argumentCount !== 1) {throw new Error(`Expected 1 arguments, but got ${argumentCount}.`);}
  if (typeof dim !== "number") {throw new Error("Invalid the first argument type, must be a number.");}
  if (!Number.isInteger(dim) || dim <= 0) {throw new Error("Dimensions must be a positive integer.");}
}

export function validateVector(vector: Vector, dimensions: number, position = "first"): void {
  if (!Array.isArray(vector) && !(vector instanceof Float32Array) && !(vector instanceof Uint8Array)) {
    throw new Error(`Invalid the ${position} argument type, must be an Array.`);
  }
  if (vector.length !== dimensions) {
    throw new Error(`Invalid the ${position} array length (expected ${dimensions}, but got ${vector.length}).`);
  }
  if (!Array.from(vector).every(Number.isFinite)) {throw new Error("Vector values must be finite numbers.");}
}

export function validateDistance(first: Vector, second: Vector, dimensions: number, count: number): void {
  if (count !== 2) {throw new Error(`Expected 2 arguments, but got ${count}.`);}
  validateVector(first, dimensions);
  validateVector(second, dimensions, "second");
}

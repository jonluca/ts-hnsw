/**
 * FastPriorityQueue.js : a fast heap-based priority queue  in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized heap-based priority queue for modern browsers and JavaScript engines.
 *
 * Usage :
 Installation (in shell, if you use node):
 $ npm install fastpriorityqueue

 Running test program (in JavaScript):

 // var FastPriorityQueue = require("fastpriorityqueue");// in node
 var x = new FastPriorityQueue();
 x.add(1);
 x.add(0);
 x.add(5);
 x.add(4);
 x.add(3);
 x.peek(); // should return 0, leaves x unchanged
 x.size; // should return 5, leaves x unchanged
 while(!x.isEmpty()) {
           console.log(x.poll());
         } // will print 0 1 3 4 5
 x.trim(); // (optional) optimizes memory usage
 */
const defaultComparator = <T>(a: T, b: T) => a < b;
type Comparator<T = number> = (a: T, b: T) => boolean;

// the provided comparator function should take a, b and return *true* when a < b
export class FastPriorityQueue<T = number> {
  compare: Comparator<T>;
  array: T[];
  size: number;
  constructor(comparator?: Comparator<T>) {
    this.array = [];
    this.size = 0;
    this.compare = comparator || defaultComparator;
  }

  // copy the priority queue into another, and return it. Queue items are shallow-copied.
  // Runs in `O(n)` time.
  clone() {
    const fpq = new FastPriorityQueue(this.compare);
    fpq.size = this.size;
    // clone the underlying array
    fpq.array = [...this.array];
    return fpq;
  }

  // Add an element into the queue
  // runs in O(log n) time
  add(myval: T) {
    let i = this.size;

    this.array[this.size] = myval;
    this.size += 1;
    let p;
    let ap;
    while (i > 0) {
      p = (i - 1) >> 1;
      ap = this.array[p];
      if (!this.compare(myval, ap)) {
        break;
      }
      this.array[i] = ap;
      i = p;
    }
    this.array[i] = myval;
  }

  // replace the content of the heap by provided array and "heapify it"
  heapify(arr: T[]) {
    this.array = arr;
    this.size = arr.length;
    let i;
    for (i = this.size >> 1; i >= 0; i--) {
      this._percolateDown(i);
    }
  }

  // for internal use
  _percolateUp(i: number, force: boolean) {
    const myval = this.array[i];
    let p;
    let ap;
    while (i > 0) {
      p = (i - 1) >> 1;
      ap = this.array[p];
      // force will skip the compare
      if (!force && !this.compare(myval, ap)) {
        break;
      }
      this.array[i] = ap;
      i = p;
    }
    this.array[i] = myval;
  }

  // for internal use
  _percolateDown(i: number) {
    const size = this.size;
    const hsize = this.size >>> 1;
    const ai = this.array[i];
    let l;
    let r;
    let bestc;
    while (i < hsize) {
      l = (i << 1) + 1;
      r = l + 1;
      bestc = this.array[l];
      if (r < size) {
        if (this.compare(this.array[r], bestc)) {
          l = r;
          bestc = this.array[r];
        }
      }
      if (!this.compare(bestc, ai)) {
        break;
      }
      this.array[i] = bestc;
      i = l;
    }
    this.array[i] = ai;
  }

  // internal
  // _removeAt(index) will remove the item at the given index from the queue,
  // retaining balance. returns the removed item, or undefined if nothing is removed.
  _removeAt(index: number) {
    if (index > this.size - 1 || index < 0) {
      return undefined;
    }

    // impl1:
    //this.array.splice(index, 1);
    //this.heapify(this.array);
    // impl2:
    this._percolateUp(index, true);
    return this.poll();
  }

  // remove(myval) will remove an item matching the provided value from the
  // queue, checked for equality by using the queue's comparator.
  // return true if removed, false otherwise.
  remove(myval: T) {
    for (let i = 0; i < this.size; i++) {
      if (!this.compare(this.array[i], myval) && !this.compare(myval, this.array[i])) {
        // items match, comparator returns false both ways, remove item
        this._removeAt(i);
        return true;
      }
    }
    return false;
  }

  // removeOne(callback) will execute the callback function for each item of the queue
  // and will remove the first item for which the callback will return true.
  // return the removed item, or undefined if nothing is removed.
  removeOne(callback: (item: T) => boolean) {
    if (typeof callback !== "function") {
      return undefined;
    }
    for (let i = 0; i < this.size; i++) {
      if (callback(this.array[i])) {
        return this._removeAt(i);
      }
    }
  }

  // remove(callback[, limit]) will execute the callback function for each item of
  // the queue and will remove each item for which the callback returns true, up to
  // a max limit of removed items if specified or no limit if unspecified.
  // return an array containing the removed items.
  // The callback function should be a pure function.
  removeMany(callback: (item: T) => boolean, limit: number) {
    // Skip unnecessary processing for edge cases
    if (typeof callback !== "function" || this.size < 1) {
      return [];
    }
    limit = limit ? Math.min(limit, this.size) : this.size;

    // Prepare the results container to hold up to the results limit
    let resultSize = 0;
    const result = new Array(limit);

    // Prepare a temporary array to hold items we'll traverse through and need to keep
    let tmpSize = 0;
    const tmp = new Array(this.size);

    while (resultSize < limit && !this.isEmpty()) {
      // Dequeue items into either the results or our temporary array
      const item = this.poll()!;
      if (callback(item)) {
        result[resultSize++] = item;
      } else {
        tmp[tmpSize++] = item;
      }
    }
    // Update the result array with the exact number of results
    result.length = resultSize;

    // Re-add all the items we can keep
    let i = 0;
    while (i < tmpSize) {
      this.add(tmp[i++]);
    }

    return result;
  }

  // Look at the top of the queue (one of the smallest elements) without removing it
  // executes in constant time
  //
  // Calling peek on an empty priority queue returns
  // the "undefined" value.
  // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/undefined
  //
  peek(): T | undefined {
    if (this.size == 0) {
      return undefined;
    }
    return this.array[0];
  }

  // remove the element on top of the heap (one of the smallest elements)
  // runs in logarithmic time
  //
  // If the priority queue is empty, the function returns the
  // "undefined" value.
  // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/undefined
  //
  // For long-running and large priority queues, or priority queues
  // storing large objects, you may  want to call the trim function
  // at strategic times to recover allocated memory.
  poll() {
    if (this.size == 0) {
      return undefined;
    }
    const ans = this.array[0];
    if (this.size > 1) {
      this.array[0] = this.array[--this.size];
      this._percolateDown(0);
    } else {
      this.size -= 1;
    }
    return ans;
  }

  // This function adds the provided value to the heap, while removing
  // and returning one of the smallest elements (like poll). The size of the queue
  // thus remains unchanged.
  replaceTop(myval: T) {
    if (this.size == 0) {
      return undefined;
    }
    const ans = this.array[0];
    this.array[0] = myval;
    this._percolateDown(0);
    return ans;
  }

  // recover unused memory (for long-running priority queues)
  trim() {
    this.array = this.array.slice(0, this.size);
  }

  // Check whether the heap is empty
  isEmpty() {
    return this.size === 0;
  }

  // iterate over the items in order, pass a callback that receives (item, index) as args.
  // TODO once we transpile, uncomment
  // if (Symbol && Symbol.iterator) {
  //   FastPriorityQueue.prototype[Symbol.iterator] = function*() {
  //     if (this.isEmpty()) return;
  //     var fpq = this.clone();
  //     while (!fpq.isEmpty()) {
  //       yield fpq.poll();
  //     }
  //   };
  // }
  forEach(callback: (value: T, index: number) => void) {
    if (this.isEmpty() || typeof callback != "function") {
      return;
    }
    let i = 0;
    const fpq = this.clone();
    while (!fpq.isEmpty()) {
      callback(fpq.poll()!, i++);
    }
  }

  // return the k 'smallest' elements of the queue as an array,
  // runs in O(k log k) time, the elements are not removed
  // from the priority queue.
  kSmallest(k: number) {
    if (this.size == 0 || k <= 0) {
      return [];
    }
    k = Math.min(this.size, k);
    const newSize = Math.min(this.size, 2 ** (k - 1) + 1);
    if (newSize < 2) {
      return [this.peek()];
    }

    const fpq = new FastPriorityQueue(this.compare);
    fpq.size = newSize;
    fpq.array = this.array.slice(0, newSize);

    const smallest = new Array(k);
    for (let i = 0; i < k; i++) {
      smallest[i] = fpq.poll();
    }
    return smallest;
  }
}

export default FastPriorityQueue;

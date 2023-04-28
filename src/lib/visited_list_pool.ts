import { Mutex } from "async-mutex";
export type VlType = number;

export class VisitedList {
  public mass: VlType[];
  public numElements: number;

  constructor(numElements: number) {
    this.numElements = numElements;
    this.mass = new Array<VlType>(numElements).fill(0);
  }

  reset(): void {
    this.mass.fill(0);
  }
}
///////////////////////////////////////////////////////////
//
// Class for multi-threaded pool-management of VisitedLists
//
/////////////////////////////////////////////////////////

export class VisitedListPool {
  private pool: VisitedList[];
  private poolguard: Mutex;
  private numelements: number;

  constructor(maxPools: number, numElements: number) {
    this.numelements = numElements;
    this.pool = [];
    this.poolguard = new Mutex();
    for (let i = 0; i < maxPools; i++) {
      this.pool.push(new VisitedList(numElements));
    }
  }

  async getFreeVisitedList(): Promise<VisitedList> {
    let rez: VisitedList;
    {
      await this.poolguard.acquire();
      try {
        if (this.pool.length > 0) {
          rez = this.pool.shift()!;
        } else {
          rez = new VisitedList(this.numelements);
        }
      } finally {
        this.poolguard.release();
      }
    }
    rez.reset();
    return rez;
  }

  async releaseVisitedList(vl: VisitedList): Promise<void> {
    await this.poolguard.acquire();
    try {
      this.pool.unshift(vl);
    } finally {
      this.poolguard.release();
    }
  }
}

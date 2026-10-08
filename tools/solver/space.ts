/**
 * Solver state store (docs/TECH_DESIGN.md §2R.5 `space.ts`): every explored state once, keyed by its 64-bit Zobrist
 * hash (core/hash.ts, two 32-bit lanes), in an open-addressing table, plus a compact copy of its buffer so a state can
 * be rebuilt for expansion and replay.
 *
 * Compact copy: the state buffer XOR the level's normalised start buffer, written as (skip, value) varint pairs over the
 * non-zero words. A move changes a few dozen words (piece records, occupancy, masks), so a record is ≈ 40–150 bytes
 * (Bölüm 10's buffer is 180 words, 720 bytes). Decoding is `set(template)` + a few writes (≈ 1 µs).
 *
 * Node-only tool code: typed arrays grow by doubling; nothing here is used by the game.
 */

/** Growable Int32 list. */
export class IntList {
  data: Int32Array;
  length = 0;
  constructor(capacity = 1024) {
    this.data = new Int32Array(capacity);
  }
  push(v: number): void {
    if (this.length === this.data.length) this.grow(this.length * 2);
    this.data[this.length++] = v;
  }
  grow(capacity: number): void {
    const next = new Int32Array(capacity);
    next.set(this.data.subarray(0, this.length));
    this.data = next;
  }
  /** A trimmed copy. */
  toArray(): Int32Array {
    return this.data.slice(0, this.length);
  }
}

/** Growable Uint8 list. */
export class ByteList {
  data: Uint8Array;
  length = 0;
  constructor(capacity = 1024) {
    this.data = new Uint8Array(capacity);
  }
  push(v: number): void {
    if (this.length === this.data.length) this.ensure(this.length + 1);
    this.data[this.length++] = v;
  }
  ensure(capacity: number): void {
    if (capacity <= this.data.length) return;
    let n = this.data.length * 2;
    while (n < capacity) n *= 2;
    const next = new Uint8Array(n);
    next.set(this.data.subarray(0, this.length));
    this.data = next;
  }
  toArray(): Uint8Array {
    return this.data.slice(0, this.length);
  }
}

/**
 * Every state of one exploration: hash index + compact buffers. State indices are dense (0, 1, 2 … in insertion
 * order); the exploration inserts in BFS order, so the index is also the discovery order.
 */
export class StateSpace {
  /** The normalised start buffer every record is XORed with. */
  readonly template: Int32Array;
  private slots: Int32Array;
  private mask: number;
  private lo: Uint32Array;
  private hi: Uint32Array;
  private offsets: Uint32Array;
  private readonly arena = new ByteList(1 << 16);
  count = 0;

  constructor(template: Int32Array, capacity = 1 << 12) {
    this.template = template.slice();
    let size = 1 << 12;
    while (size < capacity * 2) size *= 2;
    this.slots = new Int32Array(size);
    this.mask = size - 1;
    this.lo = new Uint32Array(capacity);
    this.hi = new Uint32Array(capacity);
    this.offsets = new Uint32Array(capacity + 1);
  }

  /** State index of the hash, or −1. */
  find(lo: number, hi: number): number {
    const slots = this.slots;
    let i = slot(lo, hi) & this.mask;
    for (;;) {
      const v = slots[i] ?? 0;
      if (v === 0) return -1;
      const idx = v - 1;
      if (this.lo[idx] === lo && this.hi[idx] === hi) return idx;
      i = (i + 1) & this.mask;
    }
  }

  /** Adds a state (the caller checked `find` first) and returns its index. */
  add(lo: number, hi: number, buf: Int32Array): number {
    const idx = this.count;
    if (idx + 1 >= this.lo.length) this.growRecords(this.lo.length * 2);
    if ((idx + 1) * 2 > this.slots.length) this.rehash(this.slots.length * 2);
    this.lo[idx] = lo >>> 0;
    this.hi[idx] = hi >>> 0;
    this.encode(buf);
    this.count = idx + 1;
    this.offsets[idx + 1] = this.arena.length;
    let i = slot(lo >>> 0, hi >>> 0) & this.mask;
    while ((this.slots[i] ?? 0) !== 0) i = (i + 1) & this.mask;
    this.slots[i] = idx + 1;
    return idx;
  }

  hashLo(idx: number): number {
    return this.lo[idx] ?? 0;
  }
  hashHi(idx: number): number {
    return this.hi[idx] ?? 0;
  }

  /** Rebuilds the buffer of state `idx` into `out` (length = template length). */
  load(idx: number, out: Int32Array): void {
    out.set(this.template);
    const data = this.arena.data;
    let p = this.offsets[idx] ?? 0;
    const end = this.offsets[idx + 1] ?? 0;
    let pos = -1;
    while (p < end) {
      // skip
      let skip = 0;
      let shift = 0;
      let b: number;
      do {
        b = data[p++] ?? 0;
        skip += (b & 127) * 2 ** shift;
        shift += 7;
      } while (b & 128);
      let v = 0;
      shift = 0;
      do {
        b = data[p++] ?? 0;
        v += (b & 127) * 2 ** shift;
        shift += 7;
      } while (b & 128);
      pos += skip + 1;
      out[pos] = (this.template[pos] ?? 0) ^ (v | 0);
    }
  }

  /** Bytes held by the store (records + index + hashes), for the report. */
  bytes(): number {
    return (
      this.arena.data.byteLength +
      this.slots.byteLength +
      this.lo.byteLength +
      this.hi.byteLength +
      this.offsets.byteLength
    );
  }

  private encode(buf: Int32Array): void {
    const tpl = this.template;
    const arena = this.arena;
    arena.ensure(arena.length + buf.length * 10);
    let last = -1;
    for (let i = 0; i < buf.length; i++) {
      const d = ((buf[i] ?? 0) ^ (tpl[i] ?? 0)) >>> 0;
      if (d === 0) continue;
      writeVarint(arena, i - last - 1);
      writeVarint(arena, d);
      last = i;
    }
  }

  private growRecords(capacity: number): void {
    const lo = new Uint32Array(capacity);
    lo.set(this.lo);
    this.lo = lo;
    const hi = new Uint32Array(capacity);
    hi.set(this.hi);
    this.hi = hi;
    const off = new Uint32Array(capacity + 1);
    off.set(this.offsets);
    this.offsets = off;
  }

  private rehash(size: number): void {
    const slots = new Int32Array(size);
    const mask = size - 1;
    for (let idx = 0; idx < this.count; idx++) {
      let i = slot(this.lo[idx] ?? 0, this.hi[idx] ?? 0) & mask;
      while ((slots[i] ?? 0) !== 0) i = (i + 1) & mask;
      slots[i] = idx + 1;
    }
    this.slots = slots;
    this.mask = mask;
  }
}

function slot(lo: number, hi: number): number {
  return (lo ^ Math.imul(hi, 0x9e3779b1)) >>> 0;
}

function writeVarint(out: ByteList, value: number): void {
  let v = value;
  const data = out.data;
  let n = out.length;
  while (v >= 128) {
    data[n++] = (v & 127) | 128;
    v = Math.floor(v / 128);
  }
  data[n++] = v;
  out.length = n;
}

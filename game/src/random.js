// A small seeded random source (mulberry32), so a seed always replays the same
// falling pattern: `?seed=N` fixes it, and the screenshot scenes depend on it.
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) | 0;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + this.next() * (max - min);
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    chance(probability) {
      return this.next() < probability;
    },
  };
}

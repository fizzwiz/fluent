import { What } from "./What.js";

/**
 * The `AsyncEach` class implements a lazy, composable, **asynchronous iterable** interface.
 *
 * Each instance is defined by its `[Symbol.asyncIterator]()` implementation.  
 * It provides static and instance methods to construct, transform, and evaluate async sequences.
 *
 * `AsyncEach` shares the same fluent API as {@link What} and {@link Each}, exposing the 9 core methods:
 * - {@link AsyncEach#if if()}
 * - {@link AsyncEach#sthen sthen()}
 * - {@link AsyncEach#else else()}
 * - {@link AsyncEach#which which()}
 * - {@link AsyncEach#when when()}
 * - {@link AsyncEach#match match()}
 * - {@link AsyncEach#each each()}
 * - {@link AsyncEach#self self()}
 * - {@link AsyncEach#what what()}
 *
 * This enables declarative and composable pipelines over asynchronous sequences with **lazy evaluation**.
 *
 * @example
 * const seq = AsyncEach.of(
 *   Promise.resolve(1),
 *   Promise.resolve(2),
 *   Promise.resolve(3)
 * ).sthen(x => x * 2);
 *
 * for await (const value of seq.when()) {
 *   console.log(value); // 2, 4, 6
 * }
 *
 * An iterable of Promises can be transformed and composed like any other iterable
 * using the methods of the {@link Each} class.  
 * Finally, {@link Each.when} can transform an iterable of Promises into an `AsyncEach` of resolved values,
 * allowing you to compose, restrict, and transform asynchronously even before the values are available.
 *
 * @see {@link What}
 * @see {@link Each}
 * @class
 */
export class AsyncEach {

  /**
   * Abstract async iterator method.
   * Subclasses or instances must override this.
   * @returns {AsyncIterator<*>}
   */
  [Symbol.asyncIterator]() {
    throw 'abstract method!';
  }

  /**
   * Creates an `AsyncEach` from given items (values or Promises).
   * @param  {...any} items Items or promises
   * @returns {AsyncEach} A new AsyncEach instance
   */
  static of(...items) {
    const got = new AsyncEach();
    got[Symbol.asyncIterator] = async function* () {
      for (const item of items) {
        yield await item; // resolve promises if any
      }
    };
    return got;
  }

  /**
   * Coerces an input into an `AsyncEach`.
   * - If already an `AsyncEach`, returns it.
   * - If async iterable, wraps it.
   * - If sync iterable, wraps it.
   * - Otherwise, wraps scalar as one-item sequence.
   *
   * @param {*} items Input sequence or value
   * @returns {AsyncEach}
   */
  static as(items) {
    if (items instanceof AsyncEach) return items;

    if (items != null && typeof items[Symbol.asyncIterator] === 'function') {
      const instance = new AsyncEach();
      instance[Symbol.asyncIterator] = async function* () {
        for await (const x of items) yield x;
      };
      return instance;
    }

    if (items != null && typeof items[Symbol.iterator] === 'function') {
      const instance = new AsyncEach();
      instance[Symbol.asyncIterator] = async function* () {
        for (const x of items) yield x;
      };
      return instance;
    }

    return AsyncEach.of(items);
  }

  /**
   * Collects this `AsyncEach` into an array of resolved values.
   * @returns {Promise<Array<*>>} Resolves to an array
   */
  async toArray() {
    const result = [];
    for await (const item of this) result.push(item);
    return result;
  }

  /**
   * Compares this `AsyncEach` with another iterable or AsyncEach for deep equality.
   * @param {Iterable|AsyncIterable} that
   * @returns {Promise<boolean>} Resolves to true if equal
   */
  async equals(that) {
    return AsyncEach.equal(this, that);
  }

  /**
   * Creates a potentially infinite AsyncEach starting from an initial value,
   * generating next values using a function.
   *
   * @static
   * @param {*} start Initial value
   * @param {Function} next Function (sync or async) to generate next value
   * @returns {AsyncEach} Infinite AsyncEach
   */
  static along(start, next) {
    const got = new AsyncEach();
    got[Symbol.asyncIterator] = async function* () {
      let current = start;
      while (current != null) {
        yield current;
        current = await What.what(next, current);
      }
    };
    return got;
  }

  /**
   * Checks deep equality between two async iterables or iterables.
   *
   * @static
   * @param {Iterable|AsyncIterable} aa
   * @param {Iterable|AsyncIterable} bb
   * @returns {Promise<boolean>} Resolves to true if equal
   */
  static async equal(aa, bb) {
    const ait = AsyncEach.as(aa)[Symbol.asyncIterator]();
    const bit = AsyncEach.as(bb)[Symbol.asyncIterator]();

    while (true) {
      const [a, b] = await Promise.all([ait.next(), bit.next()]);
      if (a.done || b.done) return a.done === b.done;
      if (a.value instanceof AsyncEach || b.value instanceof AsyncEach) {
        const eq = await AsyncEach.equal(a.value, b.value);
        if (!eq) return false;
      } else if (a.value !== b.value) return false;
    }
  }

  /**
   * Internal check for async iterable.
   * @private
   * @param {*} obj
   * @returns {boolean}
   */
  static isAsyncIterable(obj) {
    return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
  }

  /**
   * Filters items using a predicate (sync or async).
   * @param {Function} predicate A function returning boolean or Promise<boolean>
   * @returns {AsyncEach} Filtered AsyncEach
   */
  if(predicate = item => item !== undefined) {
    const source = this;
    const result = new AsyncEach();

    result[Symbol.asyncIterator] = async function* () {
      let index = 0;
      for await (const item of source) {
        if (await predicate(item, index++)) {
          yield item;
        }
      }
    };

    return result;
  }

  /**
   * Maps a function over each item (sync or async).
   * @param {Function} fn Mapping function
   * @returns {AsyncEach} Mapped AsyncEach
   */
  sthen(fn) {
    const source = this;
    const result = new AsyncEach();

    result[Symbol.asyncIterator] = async function* () {
      let index = 0;
      for await (const item of source) {
        yield await fn(item, index++);
      }
    };

    return result;
  }

  /**
   * Concatenates this `AsyncEach` with another iterable,
   * or flattens it if omitted.
   *
   * @param {Iterable|AsyncIterable|Promise} [that]
   * @returns {AsyncEach}
   */
  else(that = undefined) {
    return that === undefined
      ? AsyncEach.else(this)
      : AsyncEach.else([this, AsyncEach.as(that)]);
  }

  /**
   * Flattens an iterable of iterables into an `AsyncEach`.
   *
   * @static
   * @param {Iterable|AsyncIterable} aaa Iterable of iterables
   * @returns {AsyncEach} Flattened AsyncEach
   */
  static else(aaa) {
    const instance = new AsyncEach();

    instance[Symbol.asyncIterator] = async function* () {
      for await (const item of AsyncEach.as(aaa)) {
        const outer = AsyncEach.as(item);
        for await (const inner of outer) yield inner;
      }
    };

    return instance;
  }

  /**
   * Alias for {@link AsyncEach#if}.
   * @param {Function} predicate
   * @returns {AsyncEach}
   */
  which(predicate) {
    return this.if(predicate);
  }

  /**
   * Delegates to {@link AsyncEach.when}.
   *
   * - If called without args, bridges sync iterables of Promises to async iterables of values.
   * - If given a predicate or index, slices the sequence.
   *
   * @param {Function|number} [p]
   * @param {boolean} [start=true]
   * @param {boolean} [inclusive=start]
   * @returns {AsyncEach}
   */
  when(p, start = true, inclusive = start) {
    return AsyncEach.when(this, p, start, inclusive);
  }

/**
 * Slices an async iterable or resolves Promises.
 *
 * - No arguments: bridges async iterables of Promises to async iterables of resolved values.
 * - Predicate function: slices items starting/ending where the predicate matches.
 * - Number: slices by index.
 *
 * @static
 * @param {Iterable|AsyncIterable|Promise[]} aa Input iterable (can contain Promises)
 * @param {Function|number} [p] Predicate or index for slicing
 * @param {boolean} [start=true] Whether to start or end at the matching element
 * @param {boolean} [inclusive=start] Include the matched element
 * @returns {AsyncEach} Returns an AsyncEach of resolved or sliced values
 */

  static when(aa, p, start = true, inclusive = start) {
    if (p === undefined) {
      const got = {};
      got[Symbol.asyncIterator] = async function* () {
        for await (const a of aa) yield a;
      };
      return AsyncEach.as(got);
    }

    if (typeof p === 'number') {
      const index = p;
      p = (_, i) => i === index;
    }

    const got = new AsyncEach();

    const toStart = async function* () {
      let i = 0, started = false;
      for await (const a of aa) {
        if (started) {
          yield a;
        } else if (await What.what(p, a, i)) {
          started = true;
          if (inclusive) yield a;
        }
        i++;
      }
    };

    const toEnd = async function* () {
      let i = 0, ended = false;
      for await (const a of aa) {
        if (ended) break;
        if (await What.what(p, a, i)) {
          ended = true;
          if (inclusive) yield a;
        } else {
          yield a;
        }
        i++;
      }
    };

    got[Symbol.asyncIterator] = start ? toStart : toEnd;
    return got;
  }

  /**
   * Zips this sequence with another.
   * Mirrors {@link Each.match}.
   * @param {Iterable|AsyncIterable|Promise[]} [that]
   * @returns {AsyncEach}
   */
  match(that = undefined) {
    return that === undefined
      ? AsyncEach.match(this)
      : AsyncEach.match(this, AsyncEach.as(that));
  }

  /**
   * Zips multiple iterables together.
   * @static
   * @param {...(Iterable|AsyncIterable|Promise[])} aaa
   * @returns {AsyncEach<Array<any>>}
   */
  static match(...aaa) {
    const got = new AsyncEach();
    const asyncIterables = aaa.map(a => AsyncEach.as(a));

    got[Symbol.asyncIterator] = async function* () {
      const iterators = asyncIterables.map(it => it[Symbol.asyncIterator]());
      while (true) {
        const nexts = await Promise.all(iterators.map(it => it.next()));
        if (nexts.some(n => n.done)) break;
        yield nexts.map(n => n.value);
      }
    };

    return got;
  }

  /**
   * Cartesian product with another iterable.
   * @param {Iterable|AsyncIterable|Promise[]} [that]
   * @returns {AsyncEach}
   */
  each(that = undefined) {
    if (that === undefined) return AsyncEach.each(...this);

    const aa = this;
    const got = new AsyncEach();

    got[Symbol.asyncIterator] = async function* () {
      for await (const a of aa) {
        for await (const b of AsyncEach.as(that)) {
          yield [a, b];
        }
      }
    };

    return got;
  }

  /**
   * Cartesian product of multiple iterables.
   * Mirrors {@link Each.each}.
   *
   * @static
   * @param {...(Iterable|AsyncIterable|Promise[])} aaa
   * @returns {What}
   */
  static each(...aaa) {
    const asyncIterables = aaa.map(a => AsyncEach.as(a));

    const got = path => {
      if (path.length >= asyncIterables.length) return AsyncEach.of();

      const nextIterable = asyncIterables[path.length];
      const asyncEach = new AsyncEach();

      asyncEach[Symbol.asyncIterator] = async function* () {
        for await (const value of nextIterable) {
          yield path.add(value);
        }
      };

      return asyncEach;
    };

    return What.as(got);
  }

  /**
   * Returns a self-repeating iterable.
   * @returns {AsyncEach}
   */
  self() {
    return AsyncEach.self(this);
  }

  /**
   * Yields the same iterable indefinitely.
   * @static
   * @param {Iterable|AsyncIterable|Promise[]} aa
   * @returns {AsyncEach}
   */
  static self(aa) {
    const asyncIter = AsyncEach.as(aa);
    const got = new AsyncEach();
    got[Symbol.asyncIterator] = async function* () {
      while (true) yield asyncIter;
    };
    return got;
  }

  /**
   * Delegates to {@link AsyncEach.what}.
   * @param {Function} op
   * @param {*} got
   * @returns {Promise<*>}
   */
  what(op, got) {
    return AsyncEach.what(this, op, got);
  }

  /**
   * Reduces an async iterable.
   *
   * - With `op`: reduces like `Array.reduce` (async/sync).
   * - Without `op`: yields the first resolved item.
   *
   * @static
   * @param {AsyncIterable|Iterable<Promise>} aa
   * @param {Function} [op]
   * @param {*} [got]
   * @returns {Promise<*>}
   */
  static async what(aa, op, got) {
    const asyncIter = AsyncEach.as(aa);

    if (op) {
      let initialized = got !== undefined;
      for await (const next of asyncIter) {
        if (!initialized) {
          got = next;
          initialized = true;
        } else {
          got = await What.what(op, got, next);
        }
      }
      return got;
    } else {
      for await (const next of asyncIter) return next;
    }
  }
}

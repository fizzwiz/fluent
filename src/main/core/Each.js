import { What } from './What.js';
import { AsyncEach } from './AsyncEach.js';

/**
 * The `Each` class implements an abstract, immutable, **lazy iterable** interface.
 *
 * Each instance is defined by its `[Symbol.iterator]()` implementation, and the class
 * provides static and instance methods to construct, transform, and evaluate iterable sequences.
 *
 * `Each` shares the same fluent semantic API as {@link What} and {@link AsyncEach}, exposing
 * the 9 core methods: `if()`, `sthen()`, `else()`, `which()`, `when()`, `match()`, `each()`, `self()`, and `what()`.
 *
 * This enables declarative and composable pipelines over synchronous sequences with lazy evaluation.
 *
 * @example
 * const seq = Each.of(1, 2, 3)
 *   .sthen(x => x * 2)
 *   .if(x => x > 2);
 *
 * console.log([...seq]); // => [4, 6]
 *
 * @see {@link What}
 * @see {@link AsyncEach}
 * @class
 */
export class Each {

  /**
   * Abstract iterator method.
   * All subclasses or constructed instances must override this method.
   *
   * @abstract
   * @returns {Iterator}
   */
  [Symbol.iterator]() {
    throw 'abstract method!';
  }

  // -----------------------
  // Construction utilities
  // -----------------------

  /**
   * Converts a value or iterable into an `Each` instance.
   *
   * - `undefined` → an empty `Each`.
   * - `Each` instance → returned as-is.
   * - iterable → wrapped lazily.
   * - other values → wrapped in a single-element `Each`.
   *
   * @static
   * @param {any|Iterable|undefined} items Items to convert.
   * @returns {Each}
   *
   * @example
   * Each.as([1, 2, 3]); // iterable
   * Each.as(5);         // single element
   * Each.as();          // empty
   */
  static as(items) {
    if (items === undefined) {
      return Each.of();
    } else if (items instanceof Each) {
      return items;
    } else if (items[Symbol.iterator]) {
      const got = new Each();
      got[Symbol.iterator] = items[Symbol.iterator].bind(items);
      return got;
    } else {
      const got = new Each();
      got[Symbol.iterator] = function* () {
        yield items;
      };
      return got;
    }
  }

  /**
   * Creates an `Each` from a fixed list of items.
   *
   * @static
   * @param {...any} items Items to include.
   * @returns {Each}
   *
   * @example
   * const seq = Each.of(1, 2, 3);
   * [...seq]; // [1, 2, 3]
   */
  static of(...items) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      for (const item of items) yield item;
    };
    return got;
  }

  /**
   * Creates a potentially infinite `Each` sequence.
   *
   * Starts with an initial value and repeatedly applies a function
   * to produce the next value.
   *
   * @static
   * @param {*} start Initial value.
   * @param {Function} next Function producing the next value.
   * @returns {Each}
   *
   * @example
   * const naturals = Each.along(0, n => n + 1);
   */
  static along(start, next) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      let current = start;
      while (current) {
        yield current;
        current = next(current);
      }
    };
    return got;
  }

  // -----------------------
  // Conversion & equality
  // -----------------------

  /**
   * Converts this `Each` to a plain array.
   * @returns {Array}
   */
  toArray() {
    return Array.from(this);
  }

  /**
   * Compares this `Each` with another iterable for deep equality.
   * @param {Iterable} that Another iterable.
   * @returns {boolean}
   */
  equals(that) {
    return Each.equal(this, that);
  }

  /**
   * Checks deep equality between two iterables (or values).
   *
   * @static
   * @param {Iterable|any} aa
   * @param {Iterable|any} bb
   * @returns {boolean}
   */
  static equal(aa, bb) {
    if ((typeof aa !== 'string') && Each.isIterable(aa)
        && (typeof bb !== 'string') && Each.isIterable(bb)) {

      const ait = aa[Symbol.iterator]();
      const bit = bb[Symbol.iterator]();

      while (true) {
        const a = ait.next();
        const b = bit.next();
        if (a.done || b.done) return a.done === b.done;
        if (!Each.equal(a.value, b.value)) return false;
      }
    } else {
      return aa === bb;
    }
  }

  /**
   * Checks if an object is iterable.
   *
   * @private
   * @static
   * @param {*} obj
   * @returns {boolean}
   */
  static isIterable(obj) {
    return obj != null && typeof obj[Symbol.iterator] === 'function';
  }

  // -----------------------
  // Fluent methods
  // -----------------------

  /**
   * Filters this `Each` with a predicate.
   *
   * @param {Function|What} [p=item => item !== undefined]
   * @returns {Each}
   */
  if(p = item => item !== undefined) {
    return Each.if(this, p);
  }

  /**
   * Filters an iterable using a predicate.
   *
   * @static
   * @param {Iterable} aa Input iterable.
   * @param {Function} [p=item => item !== undefined]
   * @returns {Each}
   * @private
   */
  static if(aa, p = item => item !== undefined) {
    return Each.which(aa, p);
  }

  /**
   * Maps a function over each item.
   *
   * @param {Function|What} f Transformation function.
   * @returns {Each}
   */
  sthen(f) {
    return Each.sthen(this, f);
  }

  /**
   * Safe mapping operation (like `then` but without clashing with Promises).
   *
   * @static
   * @param {Iterable} aa Input iterable.
   * @param {Function} f Mapping function `(item, index) => result`.
   * @returns {Each}
   *
   * @example
   * const doubled = Each.sthen([1, 2, 3], x => x * 2);
   * [...doubled]; // [2, 4, 6]
   * @private
   */
  static sthen(aa, f) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      let i = 0;
      for (let a of aa) yield f(a, i++);
    };
    return got;
  }

  /**
   * Concatenates with another iterable or flattens one level.
   *
   * @param {Iterable} [that]
   * @returns {Each}
   */
  else(that = undefined) {
    return that === undefined
      ? Each.else(this)
      : Each.else(Each.of(this, Each.as(that)));
  }

  /**
   * Flattens one level of nesting.
   *
   * @static
   * @param {Iterable} aaa Iterable of iterables.
   * @returns {Each}
   */
  static else(aaa) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      for (let aa of aaa) {
        if (aa[Symbol.iterator]) {
          for (let a of aa) yield a;
        } else {
          yield aa;
        }
      }
    };
    return got;
  }

  /**
   * Alias for {@link Each.if}, kept distinct for symmetry with {@link What}.
   *
   * @param {Function|What} [p=item => item !== undefined]
   * @returns {Each}
   */
  which(p = item => item !== undefined) {
    return Each.which(this, p);
  }

  /**
   * Filters an iterable with a predicate.
   *
   * @static
   * @param {Iterable} aa Input iterable.
   * @param {Function} [p=item => item !== undefined]
   * @returns {Each}
   * @private
   */
  static which(aa, p = item => item !== undefined) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      let i = 0;
      for (let a of aa) {
        if (p(a, i++)) yield a;
      }
    };
    return got;
  }

  /**
   * Slices this `Each` based on predicate or index.
   *
   * @param {Function|number} p Predicate or index.
   * @param {boolean} [start=true] Start or end slice.
   * @param {boolean} [inclusive=start] Include boundary element.
   * @returns {Each|AsyncEach}
   */
  when(p, start = true, inclusive = start) {
    return Each.when(this, p, start, inclusive);
  }

  /**
   * Slices an iterable based on a predicate or index, or **bridges to asynchronous iteration**.
   *
   * - If `p` is a predicate function(item, index), yields items starting or ending where the predicate matches.
   * - If `p` is a number, treats it as an index boundary for slicing.
   * - If called **without arguments**, this method interprets the iterable as containing Promises
   *   and returns an {@link AsyncEach} that yields their resolved values.  
   *   This provides a natural bridge from a synchronous `Each` of Promises to an asynchronous
   *   `AsyncEach` of values.
   *
   * @static
   * @param {Iterable} aa Input iterable.
   * @param {Function|number} [p] Predicate function(item, i) or index boundary.
   * @param {boolean} [start=true] Whether to start or end the slice at the matching element.
   * @param {boolean} [inclusive=start] Whether to include the boundary element in the result.
   * @returns {Each|AsyncEach} A sliced `Each`, or an `AsyncEach` if no arguments are provided.
   *
   * @example <caption>Slice by predicate</caption>
   * const e = Each.of(1, 2, 3, 4, 5).when(x => x > 2);
   * console.log([...e]); // [3, 4, 5]
   *
   * @example <caption>Slice by index</caption>
   * const f = Each.of('a','b','c','d').when(2);
   * console.log([...f]); // ['c','d']
   *
   * @example <caption>Bridge from promises to async iteration</caption>
   * const g = Each.of(Promise.resolve(1), Promise.resolve(2)).when();
   * for await (const v of g) {
   *   console.log(v); // 1, then 2
   * }
   * @private
   */

  static when(aa, p, start = true, inclusive = start) {
    if (p === undefined) {
      const got = {};
      got[Symbol.asyncIterator] = async function* () {
        for (const a of aa) yield await a;
      };
      return AsyncEach.as(got);
    }
    if (typeof p === 'number') {
      const index = p;
      p = (_, i) => i === index;
    }
    const got = new Each();
    const toStart = function* () {
      let i = 0, started = false;
      for (let a of aa) {
        if (started) yield a;
        else if (p(a, i)) {
          started = true;
          if (inclusive) yield a;
        }
        i++;
      }
    };
    const toEnd = function* () {
      let i = 0, ended = false;
      for (let a of aa) {
        if (ended) break;
        if (p(a, i)) {
          ended = true;
          if (inclusive) yield a;
        } else {
          yield a;
        }
        i++;
      }
    };
    got[Symbol.iterator] = start ? toStart : toEnd;
    return got;
  }

  /**
   * Zips this `Each` with another iterable.
   *
   * @param {Iterable} [that]
   * @returns {Each}
   */
  match(that = undefined) {
    return that === undefined ? Each.match(...this) : Each.match(this, Each.as(that));
  }

  /**
   * Zips multiple iterables together.
   *
   * @static
   * @param {...Iterable} aaa
   * @returns {Each}
   */
  static match(...aaa) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      const iit = aaa.map(aa => aa[Symbol.iterator]());
      while (true) {
        const next = iit.map(it => it.next());
        if (next.some(entry => entry.done)) break;
        yield next.map(entry => entry.value);
      }
    };
    return got;
  }

  /**
   * Computes the Cartesian product with another iterable.
   * If another iterable is not provided, consumes this iterable (like Array.forEach()).
   * 
   * @param {Iterable} [that = undefined]
   * @returns {Each|What}
   */
  each(that = undefined) {
    if (that === undefined) {
      for(const _ of this);  // consumes the iteration
      return undefined;
    } else {
      const aa = this;
      const got = new Each();
      got[Symbol.iterator] = function* () {
        for (let a of aa) {
          for (let b of Each.as(that)) yield [a, b];
        }
      };
      return got;
    }
    
  }

  /**
   * Computes the Cartesian product of multiple iterables (lazy).
   *
   * Returns a {@link What} function that incrementally extends a path.
   *
   * @static
   * @param {...Iterable} aaa
   * @returns {What}
   */
  static each(...aaa) {
    aaa = aaa.map(aa => aa[Symbol.iterator] ? aa : [aa]);
    const got = path => path.length < aaa.length ? path.across(aaa[path.length]) : Each.of();
    return What.as(got);
  }

  /**
   * Produces an infinite repetition of this `Each`.
   *
   * @returns {Each}
   */
  self() {
    return Each.self(this);
  }

  /**
   * Infinite repetition of an iterable.
   *
   * @static
   * @param {Iterable} aa
   * @returns {Each}
   * @private
   */
  static self(aa) {
    const got = new Each();
    got[Symbol.iterator] = function* () {
      while (true) yield aa;
    };
    return got;
  }

  /**
   * Reduces this `Each` using an operation.
   *
   * @param {Function} [op]
   * @param {*} [start]
   * @returns {*}
   */
  what(op = undefined, start = undefined) {
    return Each.what(this, op, start);
  }

  /**
   * Reduces an iterable to a single value.
   *
   * @static
   * @param {Iterable} aa
   * @param {Function} [op]
   * @param {*} [got]
   * @returns {*}
   * @private
   */
  static what(aa, op, got) {
    if (op) {
      if (got === undefined) {
        got = Each.what(aa);
        aa = Each.when(aa, 1);
      }
      for (let next of aa) got = op(got, next);
      return got;
    } else {
      for (let next of aa) return next;
    }
  }
}

/**
 * Infinite natural numbers starting from 0.
 *
 * @type {Each<number>}
 */
Each.NATURAL = new Each();
Each.NATURAL[Symbol.iterator] = function* () {
  let i = 0;
  while (true) yield i++;
};

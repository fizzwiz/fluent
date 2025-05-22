import { What } from './What.js';

/**
 * The `Each` class implements an abstract, immutable, iterable interface over items.
 * It provides static and instance methods to construct, transform, and evaluate iterable sequences.
 * Every instance is defined by its implementation of the `[Symbol.iterator]` method.
 *
 * @author Roberto Venditti
 * @see {@link What}
 * @class
 */
export class Each {

    /**
     * Abstract iterator method. All instances must override this method.
     * @abstract
     * @returns {Iterator<*>}
     */
    [Symbol.iterator]() {
        throw 'abstract method!';
    }

    /**
     * Converts this `Each` instance into an array.
     * @returns {Array<*>}
     */
    toArray() {
        return Array.from(this);
    }

    /**
     * Compares this `Each` with another for deep equality.
     * @param {Iterable<*>} that
     * @returns {boolean}
     */
    equals(that) {
        return Each.equal(this, that);
    }

    /**
     * Filters this `Each` using a predicate.
     * @param {Function | What} [p=(item) => item !== undefined]
     * @returns {Each}
     */
    if(p = item => item !== undefined) {
        return Each.if(this, p);
    }

    /**
     * Alias for `if`. Distinct meaning in the context of `What`.
     * @param {Function | What} [p=(item) => item !== undefined]
     * @returns {Each}
     */
    which(p = item => item !== undefined) {
        return Each.which(this, p);
    }

    /**
     * Maps a function over each item.
     * @param {Function | What} f - Mapping function.
     * @returns {Each}
     */
    then(f) {
        return Each.then(this, f);
    }

    /**
     * Concatenates this `Each` with another iterable.
     * @param {Iterable<*>} [that=undefined]
     * @returns {Each}
     */
    else(that = undefined) {
        return that === undefined ? Each.else(this) : Each.else(Each.of(this, Each.as(that)));
    }

    /**
     * Zips this `Each` with another iterable.
     * @param {Iterable<*>} [that=undefined]
     * @returns {Each}
     */
    match(that = undefined) {
        return that === undefined ? Each.match(...this) : Each.match(this, Each.as(that));
    }

    /**
     * Computes the Cartesian product of this `Each` with another.
     * @param {Iterable<*>} [that=undefined]
     * @returns {Each | What<Path>}
     */
    each(that = undefined) {
        if (that === undefined) return Each.each(...this);

        const aa = this;
        const got = new Each();

        got[Symbol.iterator] = function* () {
            for (let a of aa) {
                for (let b of Each.as(that)) {
                    yield [a, b];
                }
            }
        };

        return got;
    }

    /**
     * Slices the iteration when the predicate (or index) triggers.
     * @param {Function | number} p - Predicate or index.
     * @param {boolean} [start=true] - Whether to start or end at `p`.
     * @param {boolean} [inclusive=start] - Include the boundary element.
     * @returns {Each}
     */
    when(p, start = true, inclusive = start) {
        return Each.when(this, p, start, inclusive);
    }

    /**
     * Produces an infinite repetition of this `Each` instance.
     * @returns {Each<Each>}
     */
    self() {
        return Each.self(this);
    }

    /**
     * Reduces the iterable using an accumulator function.
     * @param {Function} [op=undefined] - Binary operation.
     * @param {*} [start=undefined] - Initial value.
     * @returns {*}
     */
    what(op = undefined, start = undefined) {
        return Each.what(this, op, start);
    }
  
    /**
     * Converts a value or iterable to a `Each` instance.

     * @static
     * @param {undefined | any | Iterable<any>} [items=undefined] Items to convert.
     * @returns {Each} A new `Each` instance.
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
        return Each.of(items);
      }
    }
  
    /**
     * Creates a `Each` from a list of items.

     * @static
     * @param {...any} items Items to include.
     * @returns {Each} A new `Each` instance.
     */
    static of(...items) {
      return Each.as(items);
    }
  
    /**
     * Creates a potentially infinite `Each` starting from an initial value, generating next values using a function.

     * @static
     * @param {*} start Initial value.
     * @param {Function} next Function to generate next value.
     * @returns {Each} A new `Each` instance.
     */
    static along(start, next) {
      const got = new Each();
  
      got[Symbol.iterator] = function* () {
        let current = start;
        while (current) {
          yield current;
          current = What.what(next, current);
        }
      };
  
      return got;
    }

    /**
     * Checks deep equality between two iterables.
     * @param {Iterable<any>} aa
     * @param {Iterable<any>} bb
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
     * @param {*} obj
     * @returns {boolean}
     * @private
     */
    static isIterable(obj) {
        return obj != null && typeof obj[Symbol.iterator] === 'function';
    } 

    /**
     * Filters an iterable using a predicate.
     * @static
     * @param {Iterable<any>} aa The input iterable.
     * @param {Function} [p=item => item !== undefined] Predicate function.
     * @returns {Each} Filtered `Each` instance.
     */
    static if(aa, p = item => item !== undefined) {
      return Each.which(aa, p);
    }
  
    /**
     * Filters items from an iterable using a predicate.
     * @static
     * @param {Iterable<any>} aa The input iterable.
     * @param {Function} [p=item => item !== undefined] Predicate function.
     * @returns {Each} Filtered `Each` instance.
     */
    static which(aa, p = item => item !== undefined) {
      const got = new Each();
      got[Symbol.iterator] = function* () {
        let i = 0;
        for (let a of aa) {
          if (What.what(p, a, i++)) yield a;
        }
      };
      return got;
    }
  
    /**
     * Yields the same iterable indefinitely.
     * @static
     * @param {Iterable<any>} aa The input iterable.
     * @returns {Each} Infinite `Each` instance.
     */
    static self(aa) {
      const got = new Each();
      got[Symbol.iterator] = function* () {
        while (true) yield aa;
      };
      return got;
    }
  
    /**
     * Maps a function over items in an iterable.
     * @static
     * @param {Iterable<any>} aa The input iterable.
     * @param {Function} f Mapping function.
     * @returns {Each} Transformed `Each` instance.
     */
    static then(aa, f) {
      const got = new Each();
      got[Symbol.iterator] = function* () {
        let i = 0;
        for (let a of aa) yield What.what(f, a, i++);
      };
      return got;
    }
  
    /**
     * Flattens a nested iterable by one level.
     * @static
     * @param {Iterable<any>} aaa Iterable of iterables.
     * @returns {Each} Flattened `Each` instance.
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
     * Zips multiple iterables together.
     * @static
     * @param {...Iterable<any>} aaa Input iterables.
     * @returns {Each<Array<any>>} Zipped `Each` instance.
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
     * Computes the Cartesian product of multiple iterables, returned as a `What` instance.
     *
     * Instead of eagerly generating all combinations, this method returns a `What` function
     * that incrementally extends a given path. For a path of length `l`, it multiplies it
     * with the elements of the `l`-th iterable (`aaa[l]`). This lazy, functional form allows
     * selective traversal and early restriction of the Cartesian space without computing the
     * entire product upfront.
     *
     * @static
     * @param {...Iterable<any>} aaa Input iterables representing the Cartesian factors.
     * @returns {What} A `What` function that builds the Cartesian product incrementally.
     */
    static each(...aaa) {
      aaa = aaa.map(aa => aa[Symbol.iterator] ? aa : [aa]);
      const got = path => path.length < aaa.length ? path.across(aaa[path.length]) : Each.of();
      return What.as(got);
    }
  
    /**
     * Slices an iterable based on a predicate or index.

     * @static
     * @param {Iterable<any>} aa The input iterable.
     * @param {Function|number} p Predicate function or index.
     * @param {boolean} [start=true] Whether to start or end slicing at match.
     * @param {boolean} [inclusive=start] Whether to include the matched item.
     * @returns {Each} Sliced `Each` instance.
     */
    static when(aa, p, start = true, inclusive = start) {
      if (typeof p === 'number') {
        const index = p;
        p = (_, i) => i === index;
      }
  
      const got = new Each();
  
      const toStart = function* () {
        let i = 0, started = false;
        for (let a of aa) {
          if (started) {
            yield a;
          } else if (What.what(p, a, i)) {
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
          if (What.what(p, a, i)) {
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
     * Reduces an iterable to a single value.

     * @static
     * @param {Iterable<any>} aa The input iterable.
     * @param {Function} [op=undefined] Reducer function.
     * @param {*} [got=undefined] Initial accumulator value.
     * @returns {*} Reduced value.
     */
    static what(aa, op, got) {
      if (op) {
        if (got === undefined) {
          got = Each.what(aa);
          aa = Each.when(aa, 1);
        }
        for (let next of aa) {
          got = What.what(op, got, next);
        }
        return got;
      } else {
        for (let next of aa) return next;
      }
    }  
}

/**
 * 
 * Infinite natural numbers starting from 0.
 * @type {Each<number>}
 */
Each.NATURAL = new Each();
Each.NATURAL[Symbol.iterator] = function* () {
    let i = 0;
    while (true) yield i++;
};

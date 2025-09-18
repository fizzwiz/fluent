import { Each } from "./Each.js";
import { Path } from '../util/Path.js';

/**
 * The `What` class provides a **functional abstraction layer** for fluent, composable logic.
 *
 * Integrates seamlessly with {@link Each} and {@link AsyncEach} for declarative pipelines.
 * Each instance is:
 * - **Callable** like a function
 * - **Fluent** via chainable methods
 *
 * Shared semantic API (9 core methods):
 * `if()`, `sthen()`, `else()`, `which()`, `when()`, `match()`, `each()`, `self()`, and `what()`.
 *
 * @example
 * const doublePlusOne = What.as(x => x * 2)
 *   .if(x => x > 0)
 *   .sthen(x => x + 1);
 *
 * doublePlusOne(5);       // => 11
 * doublePlusOne.what(5);  // => 11
 *
 * @class
 */
export class What {

    // ----------------------
    // Abstract instance methods
    // ----------------------

    /**
     * Evaluate the function with given arguments.
     * Must be implemented by subclass or instance.
     *
     * @abstract
     * @param {...*} args Input arguments
     * @returns {*} Result of evaluation
     */
    what(...args) {
        throw new Error('Abstract method what() must be implemented in subclasses!');
    }

    /**
     * Bind a value to a key or keys.
     * Must be implemented by subclass or instance.
     *
     * @abstract
     * @param {*|Array<*>} arg Key or keys
     * @param {*} value Value to assign
     */
    let(arg, value) {
        throw new Error('Abstract method let() must be implemented!');
    }

    // ----------------------
    // Construction
    // ----------------------

    /**
     * Create a `What` that matches exact argument arrays.
     *
     * @param {*|Array<*>} args Expected argument(s)
     * @param {*} value Value to return if arguments match
     * @returns {What}
     */
    static of(args, value) {
        if (!Array.isArray(args)) args = [args];
        return What.as((...aa) => Each.equal(args, aa) ? value : undefined);
    }

    /**
     * Wrap a value, function, or What instance as a `What`.
     *
     * @param {*} f Value, function, or What instance
     * @returns {What}
     */
    static as(f) {
        if (f instanceof What) return f;
        if (typeof f !== "function") {
            const value = f;
            f = arg => arg === value;
        }
        const got = (...args) => f(...args);
        Object.setPrototypeOf(got, What.prototype);
        got.what = f;
        return got;
    }

/**
 * Attach the prototype of `instance` to function `f`.
 *
 * @param {Function} f Function to retype
 * @param {Object} instance Reference instance whose prototype to adopt
 * @returns {What}
 * @private
 */
static #retype(f, instance) {
    Object.setPrototypeOf(f, Object.getPrototypeOf(instance));
    return f;
}


    // ----------------------
    // Core fluent methods
    // ----------------------

    /**
     * Filter input using predicate.
     *
     * @param {Function} [p=item => item!==undefined] Predicate
     * @returns {What}
     */
    if(p = item => item !== undefined) {
        return What.#retype(What.if(this, p), this);
    }

    /**
     * Static version of `if`.
     *
     * @param {What|Function} f Function or What instance
     * @param {Function} [p=item => item!==undefined] Predicate
     * @returns {What}
     * @private
     */
    static if(f, p = item => item !== undefined) {
        return What.as((...args) => What.what(p, ...args) ? What.what(f, ...args) : undefined);
    }

    /**
     * Map values through a function.
     *
     * @param {...Function} f Functions to apply
     * @returns {What}
     */
    sthen(f) {
        return What.#retype(What.sthen(this, f), this);
    }

    /**
     * Static version of `sthen`.
     *
     * @param {...Function} ff Functions to apply sequentially
     * @returns {What}
     */
    static sthen(...ff) {
        return What.as(arg => {
            let got = arg;
            for (let f of ff) {
                if (got === undefined) break;
                got = What.what(f, got);
            }
            return got;
        });
    }

/**
 * Provide a fallback if this What/function returns `undefined` or throws a matching error.
 *
 * This dynamic version of `else` allows:
 * - Passing a fallback function or What instance `f` that will be evaluated if the primary
 *   function returns `undefined`.
 * - Optionally filtering caught errors by a string or regular expression. Only errors whose
 *   message matches `errStringOrRegex` (or whose stringified form matches) will be swallowed; other errors are re-thrown.
 *
 * @param {Function|What} f - Fallback function or What instance to use if the primary returns `undefined`.
 * @param {string|RegExp} [errStringOrRegex] - Optional error message string or RegExp to catch and use fallback.
 *                                             If omitted, any error is re-thrown.
 * @returns {What} A new What instance that applies the fallback logic.
 *
 * @example
 * const fn = What.as(x => {
 *   if (x < 0) throw new Error("negative");
 *   return undefined;
 * }).else(x => x * 2, /negative/);
 *
 * fn(-1); // => -2  (error "negative" matched, fallback applied)
 * fn(3);  // => 6   (primary returned undefined, fallback applied)
 */

else(f, errStringOrRegex = undefined) {
    const errMsg = typeof errStringOrRegex === 'string' ? errStringOrRegex : undefined;
    const regex = errStringOrRegex instanceof RegExp ? errStringOrRegex : undefined;

    const got = (...args) => {
        let result;
        try {
            result = this(...args);
        } catch (err) {
            const msg = err.message ?? JSON.stringify(err);
            // Only swallow the error if it matches the string or regex
            if ((errMsg && errMsg === msg) || (regex && regex.test(msg))) {
                result = undefined; // fallback will execute
            } else {
                throw err; // rethrow unmatched errors
            }
        }

        if (result === undefined) result = f(...args);
        return result;
    };

    return What.#retype(got, this);
}

    /**
     * Static version of `else`.
     *
     * @param {...What|Function} ff Alternatives
     * @returns {What}
     */
    static else(...ff) {
        return What.as(arg => {
            let got;
            for (let f of ff) {
                try { got = What.what(f, arg); }
                catch { got = undefined; }
                if (got !== undefined) break;
            }
            return got;
        });
    }

    /**
     * Filter by predicate.
     *
     * @param {Function} [p=item => item!==undefined] Predicate
     * @returns {What}
     */
    which(p = item => item !== undefined) {
        return What.#retype(What.which(this, p), this);
    }

    /**
     * Static version of `which`.
     *
     * @param {What|Function} f Function or What
     * @param {Function} [p=item => item!==undefined] Predicate
     * @returns {What}
     */
    static which(f, p = item => item !== undefined) {
        return What.as(arg => {
            const q = (value, i) => p(value, i, arg);
            return Each.as(What.what(f, arg)).which(q);
        });
    }

    /**
     * Slice values by predicate or index.
     *
     * @param {Function|number} [p] Predicate or index
     * @param {boolean} [start=true] Start or end
     * @param {boolean} [inclusive=start] Include boundary
     * @returns {What}
     */
    when(p, start = true, inclusive = start) {
        return What.#retype(What.when(this, p, start, inclusive), this);
    }

    /**
     * Static version of `when`.
     *
     * @param {What|Function} f
     * @param {Function|number} [predicateOrIndex] Predicate or index
     * @param {boolean} [start=true]
     * @param {boolean} [inclusive=start]
     * @returns {What}
     */
    static when(f, predicateOrIndex, start = true, inclusive = start) {
        const isIndex = typeof predicateOrIndex === 'number';
        return What.as((...args) => {
            const resolved = isIndex
                ? predicateOrIndex
                : (value, i) => What.what(predicateOrIndex, value, i, ...args);
            return Each.as(What.what(f, ...args)).when(resolved, start, inclusive);
        });
    }

    /**
     * Zip multiple What instances.
     *
     * @param {...What|Function} ff
     * @returns {What}
     */
    match(...ff) {
        return What.#retype(What.match(this, ...ff), this);
    }

    /**
     * Static version of `match`.
     *
     * @param {...What|Function} ff
     * @returns {What}
     */
    static match(...ff) {
        const got = ff.length < 2 ? arg => {
            const res = What.what(ff[0], arg);
            return res[Symbol.iterator]
                ? Each.as(res).sthen(v => [arg, v])
                : [arg, res];
        } : arg => ff.map(f => What.what(f, arg));
        return What.as(got);
    }

/**
 * Dynamic version: incrementally extends results for a given call.
 *
 * Applies a function or What instance `f` to each result produced by this What,
 * filters undefined results, and flattens the final iterable into an Each.
 *
 * @param {Function|What} f - Function or What to apply to each result of this What.
 * @returns {What} A new What that flattens and iterates all results produced by `f`.
 */
each(f) {
    const product = (...args) => {
        return Each.as(this(...args)) // Convert this(...) result to Each
            .which()                  // Filter undefined
            .sthen(f)                 // Apply f to each result
            .which()                  // Filter undefined again
            .else();                  // Flatten the resulting Each of iterables
    };
    return What.#retype(product, this);
}


/**
 * Static version: generates a search space of Paths across multiple Functions.
 *
 * @param {...What|Function} ff Functions or What instances
 * @returns {What} A What returning all incremental path dispositions
 */
static each(...ff) {
    return What.as(itemOrPath => {
        const path = itemOrPath instanceof Path ? itemOrPath : Path.of(itemOrPath);
        if (path.length > ff.length) return Each.of(); // no further extension

        // Incremental extension along the path
        return path.across(
            Each.as(What.what(ff[path.length - 1], path.last)).which()
        ).which();
    });
}


    /**
     * Repeat self or apply mapping to object/array.
     *
     * @param {number|string|Array} [indexOrNames]
     * @param {*} [valueOrName]
     * @returns {What}
     */
    self(indexOrNames = undefined, valueOrName = undefined) {
        return What.#retype(What.self(this, indexOrNames, valueOrName), this);
    }

    /**
     * Static version of `self`.
     *
     * @param {What|Function} f
     * @param {number|string|Array} [indexOrNames]
     * @param {*} [valueOrName]
     * @returns {What}
     */
    static self(f, indexOrNames = undefined, valueOrName = undefined) {
        let got;
        if (indexOrNames === undefined) {
            if (valueOrName === undefined) {
                got = path => path.across(Each.as(What.what(f, path.last)).which());
            } else {
                got = (...args) => {
                    const result = What.what(f, ...args);
                    if (result === undefined) return undefined;
                    const obj = {};
                    obj[valueOrName] = result;
                    return obj;
                };
            }
        } else if (typeof indexOrNames === 'number') {
            got = (...args) => {
                const aa = args.splice(indexOrNames, 0, valueOrName);
                return What.what(f, ...aa);
            };
        } else {
            got = obj => {
                const args = Each.as(typeof indexOrNames === 'string' ? [indexOrNames] : indexOrNames)
                    .sthen(next => typeof next === 'string' ? obj[next] : next);
                const result = What.what(typeof f === 'string' ? obj[f] : f, ...args);
                if (result === undefined) return undefined;
                if (valueOrName !== undefined) {
                    obj[valueOrName] = result;
                    return obj;
                }
                return result;
            };
        }
        return What.as(got);
    }

    // ----------------------
    // Utilities
    // ----------------------

    /**
     * Evaluate a What, function, or constant value.
     *
     * @param {*} f What instance, function, or value
     * @param {...*} args Arguments to evaluate
     * @returns {*} Result
     */
    static what(f, ...args) {
        return f instanceof What ? f.what(...args)
            : typeof f === 'function' ? f(...args)
            : f;
    }

}

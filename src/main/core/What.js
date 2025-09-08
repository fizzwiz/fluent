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
        return What.if(this, p);
    }

    /**
     * Static version of `if`.
     *
     * @param {What|Function} f Function or What instance
     * @param {Function} [p=item => item!==undefined] Predicate
     * @returns {What}
     */
    static if(f, p = item => item !== undefined) {
        return What.as(arg => What.what(p, arg) ? What.what(f, arg) : undefined);
    }

    /**
     * Map values through a function.
     *
     * @param {...Function} f Functions to apply
     * @returns {What}
     */
    sthen(f) {
        return What.sthen(this, f);
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
                else if (got instanceof Promise) got = got.stthen(f);
                else got = What.what(f, got);
            }
            return got;
        });
    }

    /**
     * Provide fallback(s) if undefined.
     *
     * @param {...What|Function} f Alternatives
     * @returns {What}
     */
    else(f) {
        return What.else(this, f);
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
        return What.which(this, p);
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
        return What.when(this, p, start, inclusive);
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
        return What.match(this, ...ff);
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
     * Cartesian product of results from this What.
     *
     * @param {Function|What} f Function or What to apply to each element
     * @returns {What}
     */
    each(f) {
        return What.as((...args) => {
            const result = new Each();
            const aa = Each.as(this.what(...args)).which();
            result[Symbol.iterator] = function* () {
                for (let a of aa) {
                    for (let b of Each.as(What.what(f, a)).which()) {
                        yield b;
                    }
                }
            };
            return result;
        });
    }

    /**
     * Static version of `each`.
     *
     * @param {...What|Function} ff
     * @returns {What}
     */
    static each(...ff) {
        return What.as(itemOrPath => {
            const path = itemOrPath instanceof Path ? itemOrPath : Path.of(itemOrPath);
            return path.length > ff.length
                ? Each.of()
                : path.across(Each.as(What.what(ff[path.length - 1], path.last)).which()).which();
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
        return What.self(this, indexOrNames, valueOrName);
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

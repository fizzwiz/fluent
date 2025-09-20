import { Each } from "./Each.js";
import { AsyncEach } from "./AsyncEach.js";
import { Path } from '../util/Path.js';

/**
 * `AsyncWhat` is the asynchronous counterpart of {@link What}.
 * It provides a fluent, functional interface for building
 * async-compatible data transformations, filters, and matchers.
 *
 * Core principles:
 * - All wrapped functions return Promises.
 * - Constant values are automatically wrapped into async functions.
 * - Chainable combinators (`if`, `when`, `which`, etc.) preserve async flow.
 */
export class AsyncWhat {

    // ----------------------
    // Abstract instance methods
    // ----------------------

    /**
     * Abstract: must be overridden to implement evaluation logic.
     *
     * @abstract
     * @param {...any} args Arguments to evaluate against
     * @returns {Promise<any>} Result of evaluation
     */
    async what(...args) {
        throw new Error('Abstract method what() must be implemented in subclasses!');
    }

    /**
     * Abstract: assign a variable binding (for `let`-style constructs).
     *
     * @abstract
     * @param {string} arg Variable name
     * @param {any} value Value to bind
     * @returns {Promise<any>}
     */
    async let(arg, value) {
        throw new Error('Abstract method let() must be implemented!');
    }

    // ----------------------
    // Construction
    // ----------------------

    /**
     * Create an `AsyncWhat` that matches specific argument values.
     *
     * @param {any|any[]} args Single value or list of values to match
     * @param {any} value Value to return if args match
     * @returns {AsyncWhat}
     */
    static of(args, value) {
        if (!Array.isArray(args)) args = [args];
        return AsyncWhat.as(async (...aa) => await AsyncEach.equal(args, aa) ? value : undefined);
    }

    /**
     * Wrap a function, value, or another `AsyncWhat` into an `AsyncWhat`.
     *
     * - If `f` is already an `AsyncWhat`, it is returned unchanged.
     * - If `f` is not a function, it is treated as a constant value.
     * - Otherwise, `f` is wrapped into an async function.
     *
     * @param {Function|AsyncWhat|any} f Function, async function, or constant
     * @returns {AsyncWhat}
     */
    static as(f) {
        if (f instanceof AsyncWhat) return f;
        if (typeof f !== "function") {
            const value = f;
            f = async () => value;
        }
        const got = async (...args) => await f(...args);
        Object.setPrototypeOf(got, AsyncWhat.prototype);
        got.what = f;
        return got;
    }

    /**
     * Retype a function so that it behaves like the given instance.
     *
     * @param {Function} f Function to retype
     * @param {Object} instance Instance whose prototype to adopt
     * @returns {AsyncWhat}
     */
    static retype(f, instance) {
        Object.setPrototypeOf(f, Object.getPrototypeOf(instance));
        return f;
    }

    // ----------------------
    // Core fluent methods
    // ----------------------

    /**
     * Filter out results that do not match the async predicate.
     *
     * @param {Function} [p=item=>item!==undefined] Async predicate
     * @returns {AsyncWhat}
     */
    if(p = async item => item !== undefined) {
        return AsyncWhat.retype(AsyncWhat.if(p, this), this);
    }

    /**
     * Static version of {@link if}.
     *
     * @param {Function} predicate Async predicate
     * @param {Function} f Function to wrap
     * @returns {AsyncWhat}
     */
    static if(predicate, f) {
        return AsyncWhat.as(async (...args) => await predicate(...args) ? await f(...args) : undefined);
    }

    /**
     * Sequentially apply a list of async functions, stopping if `undefined`.
     *
     * @param {...Function} ff Functions to chain
     * @returns {AsyncWhat}
     */
    sthen(...ff) {
        return AsyncWhat.retype(AsyncWhat.sthen(this, ...ff), this);
    }

    static sthen(...ff) {
        return AsyncWhat.as(async arg => {
            let got = arg;
            for (let f of ff) {
                if (got === undefined) break;
                got = await f(got);
            }
            return got;
        });
    }

    /**
     * Provide fallback if function returns `undefined` or throws a matching error.
     *
     * @param {Function} f Fallback function
     * @param {string|RegExp} [errStringOrRegex] Error match
     * @returns {AsyncWhat}
     */
    else(f, errStringOrRegex = undefined) {
        const errMsg = typeof errStringOrRegex === 'string' ? errStringOrRegex : undefined;
        const regex = errStringOrRegex instanceof RegExp ? errStringOrRegex : undefined;

        const got = async (...args) => {
            let result;
            try {
                result = await this(...args);
            } catch (err) {
                const msg = err.message ?? JSON.stringify(err);
                if ((errMsg && errMsg === msg) || (regex && regex.test(msg))) {
                    return await f(...args, err);
                } else {
                    throw err;
                }
            }

            if (result === undefined) return await f(...args);
            return result;
        };

        return AsyncWhat.retype(got, this);
    }

    /**
     * Static `else`: attempt multiple functions until one yields non-undefined.
     *
     * @param {...Function} ff Candidate functions
     * @returns {AsyncWhat}
     */
    static else(...ff) {
        return AsyncWhat.as(async arg => {
            let got;
            for (let f of ff) {
                try { got = await f(arg); }
                catch { got = undefined; }
                if (got !== undefined) break;
            }
            return got;
        });
    }

    /**
     * Keep only results passing predicate.
     *
     * @param {Function} [p=item=>item!==undefined] Async predicate
     * @returns {AsyncWhat}
     */
    which(p = async item => item !== undefined) {
        return AsyncWhat.retype(AsyncWhat.which(this, p), this);
    }

    static which(f, p = async item => item !== undefined) {
        return AsyncWhat.as(async (...args) => {
            const value = await f(...args);
            return (await p(value, ...args)) ? value : undefined;
        });
    }

    /**
     * Conditional execution: only run if predicate is true.
     *
     * @param {Function} p Async predicate
     * @returns {AsyncWhat}
     */
    when(p) {
        return AsyncWhat.retype(AsyncWhat.when(p, this), this);
    }

    static when(predicate, f) {
        return AsyncWhat.as(async (...args) => {
            const cond = await predicate(...args);
            return cond ? await f(...args) : undefined;
        });
    }

    /**
     * Apply multiple functions and return all results.
     *
     * @param {...Function} ff Async functions
     * @returns {AsyncWhat}
     */
    match(...ff) {
        return AsyncWhat.retype(AsyncWhat.match(this, ...ff), this);
    }

    static match(...ff) {
        const got = ff.length < 2 ? async arg => {
            const res = await ff[0](arg);
            return [arg, res];
        } : async arg => {
            const results = [];
            for (let f of ff) results.push(await f(arg));
            return results;
        };
        return AsyncWhat.as(got);
    }

    /**
     * Map over iterable/collection results asynchronously.
     *
     * @param {Function} f Async mapper
     * @returns {AsyncWhat}
     */
    each(f) {
        const product = async (...args) => {
            return await AsyncEach.as(await this(...args))
                .which()
                .sthen(f)
                .which()
                .else()
                .toArray();
        };
        return AsyncWhat.retype(product, this);
    }

    /**
     * Static version of `each`.
     *
     * @param {...Function} ff Async functions
     * @returns {AsyncWhat}
     */
    static each(...ff) {
        return AsyncWhat.as(async itemOrPath => {
            const path = itemOrPath instanceof Path ? itemOrPath : Path.of(itemOrPath);
            if (path.length > ff.length) return Each.of();
            return path.across(
                await AsyncEach.as(await AsyncWhat.as(ff[path.length - 1])(path.last)).which().toArray()
            ).which();
        });
    }

    /**
     * Self-application: binds inputs/outputs to object properties or paths.
     *
     * @param {number|string|string[]} [indexOrNames] Input index or property names
     * @param {string} [valueOrName] Output property name
     * @returns {AsyncWhat}
     */
    self(indexOrNames = undefined, valueOrName = undefined) {
        return AsyncWhat.retype(AsyncWhat.self(this, indexOrNames, valueOrName), this);
    }

    static self(f, indexOrNames = undefined, valueOrName = undefined) {
        let got;
        if (indexOrNames === undefined) {
            if (valueOrName === undefined) {
                // Path-expanding mode
                got = async path => path.across(await AsyncEach.as(await f(path.last)).which().toArray());
            } else {
                // Wrap return in object { name: result }
                got = async (...args) => {
                    const result = await f(...args);
                    if (result === undefined) return undefined;
                    const obj = {};
                    obj[valueOrName] = result;
                    return obj;
                };
            }
        } else if (typeof indexOrNames === 'number') {
            // Inject argument at index
            got = async (...args) => {
                const aa = args.splice(indexOrNames, 0, valueOrName);
                return await f(...aa);
            };
        } else {
            // Extract properties from object
            got = async obj => {
                let args = [];
                for await (let next of AsyncEach.as(
                    typeof indexOrNames === 'string' ? [indexOrNames] : indexOrNames
                ).sthen(next => typeof next === 'string' ? obj[next] : next)) {
                    args.push(next);
                };
                const result = await (typeof f === 'string' ? obj[f] : f)(...args);
                if (result === undefined) return undefined;
                if (valueOrName !== undefined) {
                    obj[valueOrName] = result;
                    return obj;
                }
                return result;
            };
        }
        return AsyncWhat.as(got);
    }

}

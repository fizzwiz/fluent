import { Each } from "./Each.js";
import { AsyncEach } from "./AsyncEach.js";
import { Path } from '../util/Path.js';
import { Errors, TimeoutError } from "../util/Errors.js";

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
     * Provide a fallback if this What/function returns `undefined` or throws a matching error.
     *
     * This dynamic version of `else` allows:
     * - Passing a fallback function or What instance `f` that will be evaluated if the primary
     *   function returns `undefined`.
     * - Optionally filtering caught errors by a matcher. Only errors that match
     *   the matcher will trigger the fallback; unmatched errors are re-thrown.
     * - If `matcher` is omitted, all errors are caught and passed to the fallback.
     *
     * Supported matcher types:
     * - number → matches `statusCode` (if the Error provides such a property)
     * - string → matches class name (e.g. "HttpError", "DomError")
     * - RegExp → tests against error message
     * - function → custom predicate `(err) => boolean`
     *
     * @param {Function|What|AsyncWhat} f - Fallback function or What instance to use if the primary returns `undefined` or a matching error is thrown.
     *                             If a matching error occurs, it is passed as the last argument to `f`.
     * @param {string|number|RegExp|Function} [matcher] - Optional matcher to filter caught errors.
     *                                                    If omitted, all errors are caught.
     * @returns {AsyncWhat} A new AsyncWhat instance that applies the fallback logic.
     *
     */
    else(f, matcher = undefined) {

        const got = async (...args) => {
            let result;
            try {
                result = await this(...args);
            } catch (err) {
               // If no matcher provided, fallback catches all errors
                if (!matcher || Errors.matches(err, matcher)) {
                    return f(...args, err);
                }
                throw err; // rethrow unmatched errors
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
        return AsyncWhat.if(predicate, f);
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
     * Self-application: adapts this AsyncWhat for timeouts, argument binding, or
     * context property mapping, depending on the type of the first argument.
     *
     * Overloads:
     *
     * 1. Timeout mode (number only):
     *    - `self(ms)` → runs this AsyncWhat with a timeout in milliseconds.
     *      Throws a TimeoutError if execution exceeds `ms`.
     *
     * 2. Argument-binding mode (number + value):
     *    - `self(index, value)` → injects `value` into the arguments at position `index`.
     *
     * 3. Context-mapping mode (string):
     *    - `self(name)` → extracts `ctx[name]` as input to this AsyncWhat.
     *    - `self(nameIn, nameOut)` → uses `ctx[nameIn]` as input, and stores the result
     *      into `ctx[nameOut]`.
     *
     * 4. Context-mapping mode (string[]):
     *    - `self([name1, name2, ...])` → extracts multiple properties from `ctx` as arguments.
     *    - `self([name1, name2, ...], nameOut)` → same as above, but stores the result
     *      back into `ctx[nameOut]`.
     *
     * @param {number|string|string[]} [timeoutOrIndexOrNames]
     *        Timeout in ms, argument index, or property name(s) to extract from ctx.
     * @param {string} [valueOrName]
     *        Argument value to inject (if first arg is a number), or output property
     *        name for storing results (if first arg is a string or string[]).
     * @returns {AsyncWhat}
     */
    self(timeoutOrIndexOrNames = undefined, valueOrName = undefined) {
        return AsyncWhat.retype(AsyncWhat.self(this, timeoutOrIndexOrNames, valueOrName), this);
    }

    /**
     * 
     * @private
     */
    static self(f, timeoutOrIndexOrNames = undefined, valueOrName = undefined) {
        let got;
        if (timeoutOrIndexOrNames === undefined) {
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
        } else if (typeof timeoutOrIndexOrNames === 'number') {
            if (valueOrName === undefined) {
                // execute within timeout
                got = async ctx => await AsyncWhat.within(timeoutOrIndexOrNames, () => f(ctx), new TimeoutError(timeoutOrIndexOrNames));
            } else {
                // Inject argument at index
                got = async (...args) => {
                    return await f(...args.slice(0, timeoutOrIndexOrNames), valueOrName, ...args.slice(timeoutOrIndexOrNames));
                };
            }              
        } else {
            // Extract properties from object
            got = async obj => {
                let args = [];
                for await (let next of AsyncEach.as(
                    typeof timeoutOrIndexOrNames === 'string' ? [timeoutOrIndexOrNames] : timeoutOrIndexOrNames
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

    /**
     * Runs an async function with a timeout.
     * Rejects with a given error if it doesn’t resolve within the given time.
     *
     * @param {number} timeoutMs - Timeout in milliseconds.
     * @param {function(): Promise<any>} fn - Async function to run.
     * @param {Error} [error] - Error to reject with on timeout
     * @returns {Promise<any>}
     * @private
     */
    static async within(timeoutMs, fn, error = new Error(`Operation timed out after ${timeoutMs}ms`)) {
        let timer;
        try {
        return await Promise.race([
            fn(),
            new Promise((_, reject) => {
            timer = setTimeout(() => reject(error), timeoutMs);
            })
        ]);
        } finally {
        clearTimeout(timer);
        }
    }
}

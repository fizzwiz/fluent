import { Each } from "./Each.js";
import { Path } from '../util/Path.js';
import { AsyncWhat } from "./AsyncWhat.js";
import { Errors, TimeoutError } from "../util/Errors.js";

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
    // Construction
    // ----------------------

    /**
     * Creates a `What` instance that returns a fixed value when called
     * with an exact sequence of arguments.
     *
     * Essentially defines a single mapping:
     *
     *   (arg1, arg2, ..., argN) → value
     *
     * If the input arguments exactly match the defined sequence (deep
     * equality check via `Each.equal`), the stored value is returned;
     * otherwise `undefined`.
     *
     * ### Example
     * ```js
     * const f = What.of(1, 2, "answer");
     * console.log(f(1, 2));    // "answer"
     * console.log(f(1));       // undefined
     * console.log(f(2, 1));    // undefined
     * ```
     *
     * @param {...*} items - Argument sequence followed by the return value.
     *   The last element in `items` is treated as the value, while the
     *   preceding elements are the argument pattern to match.
     * @returns {What} A `What` instance mapping the specified arguments to the given value.
     */
    static of(...items) {
        const args = items.slice(0, -1);
        const value = items.at(-1);
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
            f = () => value;
        }
        const got = (...args) => f(...args);
        Object.setPrototypeOf(got, What.prototype);
        got.what = f.bind(got);
        return got;
    }

/**
 * Attach the prototype of `instance` to function `f`.
 *
 * @param {Function} f Function to retype
 * @param {Object} instance Reference instance whose prototype to adopt
 * @returns {What}
 */
static retype(f, instance) {
    Object.setPrototypeOf(f, Object.getPrototypeOf(instance));
    return f;
}


    // ----------------------
    // Core fluent methods
    // ----------------------

/**
 * Conditional execution: keep only inputs passing a predicate.
 *
 * Wraps this What so that it executes only if the predicate returns true.
 * If the predicate returns false, returns undefined by default. Optionally, an error can be provided to be thrown.
 *
 * @param {Function} [p=item => item !== undefined] 
 *        Predicate `(…args) => boolean` applied to the input(s).
 * @param {Error} [error=undefined] 
 *        Optional error to throw if predicate fails.
 * @returns {What} A new What filtered by the predicate.
 */
if(p = item => item !== undefined, error = undefined) {
    return What.retype(What.if(p, this, error), this);
}

/**
 * Static version of {@link if}.
 *
 * Wraps a function or What instance with a conditional predicate.
 * Returns undefined or throws `error` if the predicate fails.
 *
 * @param {Function} predicate Condition function `(…args) => boolean`.
 * @param {Function|What} f Function or What instance to wrap.
 * @param {Error} [error=undefined] Optional error to throw if predicate fails.
 * @returns {What} A new What enforcing the predicate.
 * @private
 */
static if(predicate, f, error = undefined) {
    return What.as((...args) => {
        if (predicate(...args)) return f(...args);
        if (error !== undefined) throw error;
        return undefined;
    });
}

    /**
     * Map values through a function.
     *
     * @param {...Function} f Functions to apply
     * @returns {What}
     */
    sthen(f) {
        return What.retype(What.sthen(this, f), this);
    }

    /**
     * Static version of `sthen`.
     *
     * @param {...Function} ff Functions to apply sequentially
     * @returns {What}
     * @private
     */
    static sthen(...ff) {
        return What.as(arg => {
            let got = arg;
            for (let f of ff) {
                got = f(got);
            }
            return got;
        });
    }

/**
 * Attach a fallback to handle missing results or matching errors.
 *
 * This dynamic version of `else` extends the primary function with recovery logic:
 *
 * - If the primary function returns `undefined`, the fallback `f` is invoked.
 * - If the primary function throws an error, the error is tested against the optional `matcher`.
 *   - If it matches, the fallback `f` is invoked instead.
 *   - If it does not match, the error is re-thrown.
 * - When the fallback is invoked due to an error, the error object is appended as the last argument to `f`.
 *
 * Error matching is delegated to {@link Errors.matches}, which supports:
 *   - `number`: compares against `err.statusCode`
 *   - `string`: compares against error class name, or substring match for thrown strings
 *   - `RegExp`: tested against the error message or thrown string
 *   - `Function`: custom predicate `(err) => boolean`
 *
 * Constants (non-functions) are automatically lifted
 * into functions returning that constant.
 *
 * @param {Function|What|*} f - Fallback to use if the primary
 *                              returns `undefined` or a matching error is thrown.
 *                              If `f` is a constant it is converted to a What returning it.
 * @param {string|number|RegExp|Function} [matcher] - Optional matcher to restrict which errors
 *                                                    trigger the fallback. If omitted, all errors
 *                                                    are caught.
 * @returns {What} A new What instance with fallback behavior applied.
 */
else(f, matcher) {
    f = What.as(f);  // handles constants, functions, and What
  
    const got = (...args) => {
      let result;
      try {
        result = this(...args);
      } catch (err) {
        if (!matcher || Errors.matches(err, matcher)) {
          return f(...args, err);
        }
        throw err; // rethrow unmatched errors
      }
  
      if (result === undefined) return f(...args);
      return result;
    };
  
    return What.retype(got, this);
  }
  
/**
 * Conditional output filter: keeps only results that satisfy the predicate.
 *
 * Executes this What and evaluates the predicate on the result.
 * If the predicate returns false, returns `undefined` by default. Optionally, it can throw a provided `error`.
 *
 * @param {Function} [p=item => item !== undefined] 
 *        Predicate `(result, …args) => boolean` applied to the result.
 * @param {Error} [error=undefined] 
 *        Error to throw if predicate fails.
 * @returns {What} A new What filtered by the predicate.
 */
which(p = item => item !== undefined, error = What.WHICH_ERROR) {
    return What.retype(What.which(this, p, error), this);
}

/**
 * Static version of {@link which}.
 *
 * Wraps a function or What instance with a conditional predicate.
 * Returns `undefined` if predicate fails. Optionally it can throw a provided `error`.
 *
 * @param {Function|What} f Function or What instance to wrap.
 * @param {Function} [p=item => item !== undefined] Predicate `(result, …args) => boolean`.
 * @param {Error} [error=undefined] Error to throw if predicate fails.
 * @returns {What} A new What enforcing the predicate.
 * @private
 */
static which(f, p = item => item !== undefined, error = undefined) {
    return What.as((...args) => {
        const value = f(...args);
        if (p(value, ...args)) return value;
        if (error !== undefined) throw error;
        return undefined;
    });
}

/**
 * Asynchronous conditional in event-driven mode.
 *
 * Promotes the current What (`this`) into an AsyncWhat that wraps the underlying logic
 * and executes conditionally based on the occurrence of a specified event and a predicate.
 *
 * Behavior:
 * - `start = true`: the underlying AsyncWhat is executed **only when** the predicate evaluates
 *   truthy upon the event.
 * - `start = false`: the underlying AsyncWhat is **immediately invoked** (so it can run and
 *   be stopped), and will be stopped when the predicate evaluates truthy upon the event.
 *
 * If no matching event occurs within `timeoutMs`, the returned AsyncWhat rejects with a `TimeoutError`.
 *
 * The returned AsyncWhat proxies the `.stopped` property of the underlying AsyncWhat,
 * allowing external control over cyclic or self-driven executions.
 *
 * Example: infinite cyclic execution with start/stop triggers
 * 
 *   const cyclic = doSomething.self(Infinity, 100, 1);
 * 
 *   const bounded = cyclic
 *     .when(
 *       isStart,      // predicate identifying start condition
 *       emitter,      // event source
 *       event,        // event name to listen for
 *       undefined,    // optional timeout
 *       true          // start cyclic execution when event occurs
 *     )
 *     .when(
 *       isStop,       // predicate identifying stop condition
 *       emitter,
 *       event,
 *       undefined,
 *       false         // stop cyclic execution when event occurs
 *     );
 * 
 *   bounded();   
 *
 * @param {Function} predicate - Predicate `(…eventArgs, emitter) => boolean | Promise<boolean)` to evaluate event arguments
 * @param {EventEmitter|EventTarget} emitter - Event source
 * @param {string} event - Event name to listen for
 * @param {number} [timeoutMs] - Optional timeout in milliseconds
 * @param {boolean} [start=true] - If `true`, executes the underlying AsyncWhat when predicate matches;
 *                                 if `false`, immediately invokes the underlying AsyncWhat and stops it when predicate matches
 * @returns {AsyncWhat} An AsyncWhat that resolves with the result of the underlying function (if starting)
 *                      or `undefined` (if stopping)
 * @throws {TimeoutError} If no matching event occurs within the specified timeout
 */
when(predicate, emitter, event, timeoutMs = undefined, start = true) {
    return AsyncWhat.when(predicate, this, emitter, event, timeoutMs, start);
}

    /**
     * Zip multiple What instances.
     *
     * @param {...What|Function} ff
     * @returns {What}
     */
    match(...ff) {
        return What.retype(What.match(this, ...ff), this);
    }

    /**
     * Static version of `match`.
     *
     * @param {...What|Function} ff
     * @returns {What}
     * @private
     */
    static match(...ff) {
        const got = ff.length < 2 ? arg => {
            const res = ff[0](arg);
            return [arg, res];
        } : arg => ff.map(f => f(arg));
        return What.as(got);
    }

/**
 * Dynamic version: cartesian product of twoextends results for a given call.
 *
 * Applies a function or What instance `f` to each result produced by this What and flattens the final Each of iterables into an Each.
 *
 * @param {Function|What} f - Function or What to apply to each result of this What.
 * @returns {What} A new What that flattens and iterates all results produced by `f`.
 */
each(f) {
    const product = (...args) => {
        return Each.as(this(...args)) // Convert this(...) result to Each
            .which()
            .sthen(f)                 // Apply f to each result
            .which()
            .else();                  // Flatten the resulting Each of iterables
    };
    return What.retype(product, this);
}

/**
 * Static version: generates a search space of Paths across multiple Functions.
 *
 * @param {...What|Function} ff Functions or What instances
 * @returns {What} A What returning all incremental path dispositions
 * 
 */
static each(...ff) {
    return What.as(itemOrPath => {
        const path = itemOrPath instanceof Path ? itemOrPath : Path.of(itemOrPath);
        if (path.length > ff.length) return Each.of(); // no further extension

        // Incremental extension along the path
        return path.across(
            Each.as(What.as(ff[path.length - 1])(path.last)).which()
        ).which();
    });
}

/**
 * Dynamically adapts this What instance for different use cases depending on the arguments.
 *
 * The behavior depends on the arguments passed, supporting multiple **overload modes**:
 *
 * 1. **Path-expanding mode** (no arguments):
 *    - `self()`
 *    - Converts this What: `item -> items` to a What: `path -> paths`
 *      by expanding `path.last` through the original function.
 *
 * 2. **Context-mapping / nominal mode** (string or string[] as first argument):
 *    - `self(name)` → extracts `ctx[name]` and passes it as input.  
 *    - `self(nameIn, nameOut)` → maps `ctx[nameIn]` to input and stores result in `ctx[nameOut]`.  
 *    - `self([name1, name2, ...])` → extracts multiple properties from context.  
 *    - `self([name1, name2, ...], nameOut)` → stores result in `ctx[nameOut]`.
 *
 * 3. **Argument-binding mode** (two numeric arguments):
 *    - `self(index, value)`
 *    - Injects `value` into the argument list at position `index`.
 *
 * 4. **Timeout mode** (single numeric argument):
 *    - `self(timeoutMs)`
 *    - Promotes this What to an `AsyncWhat` that rejects if the computation does not complete
 *      within `timeoutMs` milliseconds.
 *
 * 5. **Retry mode** (numeric first argument with ≥3 args):
 *    - `self(nAttempts, baseDelay, factor, maxDelay)`
 *    - Promotes this What to an `AsyncWhat` that retries execution up to `nAttempts` with
 *      exponential backoff. The resulting `AsyncWhat` exposes a `.stopped` property to
 *      cancel the retries.
 *
 * @param {number|string|string[]} [arg0] - Numeric index, retry attempts, timeout in ms, or property name(s)
 * @param {number|string} [arg1] - Value to inject (argument-binding), output property name (nominal mode),
 *                                  or retry attempts (retry mode)
 * @param {number} [baseDelay=100] - Base delay in ms for retry mode
 * @param {number} [factor=1] - Exponential backoff factor for retry mode
 * @param {number} [maxDelay=Infinity] - Maximum delay for retry mode
 * @returns {AsyncWhat|What} A new instance wrapping the adapted behavior:
 *                            - `What` for path-expanding, context-mapping, argument-binding
 *                            - `AsyncWhat` for timeout or retry mode
 */
self(...args) {
    return What.retype(What.self(this, ...args), this);
}

/**
 * Internal implementation of `self()`. Handles different overloads.
 *
 * @private
 * @param {Function} f Function to wrap (the current What instance)
 * @param {...*} args Overload-dependent arguments
 * @returns {What} Wrapped What
 */
static self(f, ...args) {
    let got;

    if(args.length === 0) { 
        // Path-expanding mode
        got = path => path.across(Each.as(f(path.last)).which().toArray());
        return What.as(got);
    } else if(typeof args[0] !== 'number') {
        // Context-mapping / nominal mode
        const [names, name] = args;
        return What.nominal(f, names, name);
    } else if(args.length === 2) {
        // Argument-binding mode
        const [index, value] = args;
        return What.partial(f, index, value);
    } else {
        // Both timeout or Retry mode produce an AsyncWhat
        return AsyncWhat.self(f, ...args);
    }
}

/**
 * Wraps a function to inject an argument at a specific index.
 *
 * Example:
 * ```js
 * const addOne = x => x + 1;
 * const addAtIndex = What.partial(addOne, 0, 5);
 * addAtIndex(); // 6
 * ```
 *
 * @private
 * @param {Function} f Function to wrap
 * @param {number} index Index at which to insert the value
 * @param {*} value Value to inject
 * @returns {What} Wrapped What
 */
static partial(f, index, value) {
    const got = (...args) => f(...args.slice(0, index), value, ...args.slice(index));
    return What.as(got);
}

/**
 * Wraps a function for nominal / context-mapping mode.
 *
 * Examples:
 * ```js
 * const getName = obj => obj.firstName;
 * const wrapped = What.nominal(getName, 'firstName', 'nameOut');
 * wrapped({ firstName: 'Alice' }); // { nameOut: 'Alice' }
 * ```
 *
 * @private
 * @param {Function|string} f Function to wrap, or key in object
 * @param {string|string[]} names Property name(s) to extract from context
 * @param {string} [name] Optional output property name to store result
 * @returns {What} Wrapped What
 */
static nominal(f, names, name) {
    let got;

    if (names === undefined) {
        // Wrap return in object { name: result }
        got = (...args) => {
            const result = f(...args);
            if (result === undefined) return undefined;
            const obj = {};
            obj[name] = result;
            return obj;
        };
    } else {
        // Extract properties from object
        got = obj => {
            const args = Each.as(typeof names === 'string' ? [names] : names)
                .sthen(key => typeof key === 'string' ? obj[key] : key)
                .toArray();

            const result = (typeof f === 'string' ? obj[f] : f)(...args);
            if (name !== undefined) {
                obj[name] = result;
                return obj;
            }
            return result;
        };
    }

    return What.as(got);
}


}

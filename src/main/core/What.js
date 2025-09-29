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
            f = () => value;
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
     * Promotes this synchronous What into an AsyncWhat that executes only when
     * a given event occurs on the specified emitter and the predicate applied
     * to the event arguments evaluates to truthy.
     *
     * Example:
     *   What.as(doSomething).when(
     *     evt => evt.type === 'message',
     *     socket,
     *     'message',
     *     5000
     *   );
     *
     * @param {Function} predicate - Predicate `(…eventArgs) => boolean`
     * @param {EventEmitter|EventTarget} emitter - Event source
     * @param {string} event - Event name to listen for
     * @param {number} [timeoutMs] - Timeout in ms
     * @returns {AsyncWhat} A new asynchronous What
     */
    when(predicate, emitter, event, timeoutMs = undefined) {
        return AsyncWhat.when(predicate, this, emitter, event, timeoutMs);
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
 * Adapts this `What` instance for argument binding or context property mapping.
 * 
 * Overloads:
 * 
 * 1. No arguments → path-expanding mode.
 *    - Returns a function that applies `f` to the last element of a Path and expands results.
 * 
 * 2. Context-mapping / nominal mode (string or string[]):
 *    - `self(name)` → extracts `ctx[name]` as input.
 *    - `self(names, nameOut)` → extracts multiple properties and optionally stores result in `ctx[nameOut]`.
 * 
 * 3. Argument-binding mode (number + value):
 *    - `self(index, value)` → injects `value` at position `index` in argument list.
 *
 * @param {...*} args Overload-dependent arguments
 * @returns {What} Wrapped What instance
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
    }

    throw new Error('Unexpected arguments in What.self()');
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

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
 * Filter inputs by an asynchronous predicate.
 *
 * Throws an error if the predicate returns falsy.
 *
 * @param {Function} [p=async item => item !== undefined] 
 *        Asynchronous predicate `(…args) => boolean | Promise<boolean)`.
 * @param {Error} [error=undefined] 
 *        Optional error to throw if the predicate fails.
 * @returns {AsyncWhat} A new AsyncWhat that executes `this` only if the predicate passes.
 */
if(p = async item => item !== undefined, error = undefined) {
    return AsyncWhat.retype(AsyncWhat.if(p, this, error), this);
}

/**
 * Static version of {@link if}.
 *
 * Wraps a function with an asynchronous predicate.
 * Throws the specified error if the predicate fails.
 *
 * @param {Function} predicate 
 *        Async predicate `(…args) => boolean | Promise<boolean)`.
 * @param {Function|AsyncWhat} f 
 *        Function or AsyncWhat to execute if predicate passes.
 * @param {Error} [error=undefined] 
 *        Optional error to throw if predicate fails.
 * @returns {AsyncWhat} New AsyncWhat that enforces the predicate.
 */
static if(predicate, f, error = undefined) {
    return AsyncWhat.as(async (...args) => {
        if (await predicate(...args)) return await f(...args);
        throw error;
    });
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
                got = await f(got);
            }
            return got;
        });
    }

/**
 * Attach a fallback to handle missing results or matching errors.
 *
 * This method extends the primary async function with recovery logic:
 *
 * - If the primary function resolves to `undefined`, the fallback `f` is awaited and returned.
 * - If the primary function rejects, the error is tested against the optional `matcher`.
 *   - If it matches, the fallback `f` is awaited and returned.
 *   - If it does not match, the error is re-thrown.
 * - When the fallback is invoked due to an error, the error object is appended as the last argument to `f`.
 *
 * Error matching is delegated to {@link Errors.matches}, which supports:
 *   - `number`: compares against `err.statusCode`
 *   - `string`: compares against error class name, or substring match for thrown strings
 *   - `RegExp`: tested against the error message or thrown string
 *   - `Function`: custom predicate `(err) => boolean`
 *
 * Non-functions (constants or Promises) are automatically
 * lifted into async functions returning that constant or awaited value.
 *
 * @param {Function|What|AsyncWhat|*} f - Fallback to use if the primary
 *                                        returns `undefined` or a matching error is thrown.
 *                                        If `f` is a constant or Promise it is converted to an AsyncWhat returning it.
 * @param {string|number|RegExp|Function} [matcher] - Optional matcher to restrict which errors
 *                                                    trigger the fallback. If omitted, all errors
 *                                                    are caught.
 * @returns {AsyncWhat} A new AsyncWhat instance with fallback behavior applied.
 */
else(f, matcher = undefined) {
    f = AsyncWhat.as(f);  // handles constants, promises, functions, AsyncWhat
  
    const got = async (...args) => {
      let result;
      try {
        result = await this(...args);
      } catch (err) {
        // If no matcher provided, fallback catches all errors
        if (!matcher || Errors.matches(err, matcher)) {
          return await f(...args, err);
        }
        throw err; // rethrow unmatched errors
      }
  
      if (result === undefined) {
        return await f(...args);
      }
      return result;
    };
  
    return AsyncWhat.retype(got, this);
  }
  
/**
 * Keep only results passing an async or sync predicate.
 *
 * Both the wrapped function `f` and the predicate `p` can be synchronous or asynchronous.
 * - If `p` resolves truthy, returns the value.
 * - If `p` resolves falsy, returns `undefined` or throws `error`.
 * - If either `f` or `p` rejects, that rejection is propagated.
 *
 * @param {Function} [p=async item => item!==undefined] 
 *        Async or sync predicate `(value, ...args) => boolean | Promise<boolean>`.
 * @param {Error} [error=undefined] 
 *        Optional error to throw if predicate fails.
 * @returns {AsyncWhat} A new AsyncWhat that enforces the predicate.
 */
which(p = async item => item !== undefined, error = undefined) {
    return AsyncWhat.retype(AsyncWhat.which(this, p, error), this);
  }
  
  /**
   * Static version of {@link which}.
   *
   * Wraps a function or AsyncWhat with a predicate.
   * Returns `undefined` or throws `error` if the predicate fails.
   *
   * @param {Function|AsyncWhat} f Function or AsyncWhat returning a value (sync or async)
   * @param {Function} [p=async item => item!==undefined] 
   *        Predicate `(value, ...args) => boolean | Promise<boolean>`.
   * @param {Error} [error=undefined] 
   *        Optional error to throw if predicate fails.
   * @returns {AsyncWhat} New AsyncWhat that enforces the predicate.
   */
  static which(f, p = async item => item !== undefined, error = undefined) {
    return AsyncWhat.as(async (...args) => {
      const value = await f(...args);
      if (await p(value, ...args)) return value;
      if (undefined !== error) throw error;
      return undefined;
    });
  }
  
/**
 * Asynchronous conditional in event-driven mode.
 *
 * Returns an AsyncWhat that executes only when a given event occurs on the
 * specified emitter and the predicate applied to the event arguments evaluates
 * truthy. Rejects with TimeoutError if no matching event is observed within
 * the given timeout.
 *
 * Example:
 *   AsyncWhat.as(doSomething).when(
 *     evt => evt.type === 'message',
 *     socket,
 *     'message',
 *     5000
 *   );
 *
 * @param {Function} predicate - Predicate `(…eventArgs, emitter) => boolean | Promise<boolean>`
 * @param {EventEmitter|EventTarget} emitter - Event source
 * @param {string} event - Event name to listen for
 * @param {number} [timeoutMs] - Timeout in ms
 * @returns {AsyncWhat} A new asynchronous What
 */
when(predicate, emitter, event, timeoutMs = undefined) {
    return AsyncWhat.when(predicate, this, emitter, event, timeoutMs);
  }
  
  /**
   * Static version of {@link when}.
   *
   * Waits for an event on an emitter. Each time the event fires,
   * evaluates `predicate(...eventArgs, emitter)`. If truthy:
   *   - removes the listener
   *   - resolves with `f(...eventArgs, emitter)`
   *
   * If no matching event occurs within `timeoutMs`, the listener is removed
   * and a `TimeoutError` is thrown.
   *
   * Works with both:
   * - Node.js EventEmitter (`on`/`off`)
   * - DOM EventTarget (`addEventListener`/`removeEventListener`)
   *
   * @param {Function} predicate - Predicate `(…eventArgs, emitter) => boolean | Promise<boolean>`
   * @param {Function|AsyncWhat} f - Handler `(…eventArgs, emitter) => any`
   * @param {EventEmitter|EventTarget} emitter - Source emitter
   * @param {string} event - Event name
   * @param {number} [timeoutMs] - Timeout in ms
   * @returns {AsyncWhat} Resolves to the result of `f`
   * @throws {TimeoutError} if timeout is reached
   */
  static when(predicate, f, emitter, event, timeoutMs) {
    
    return AsyncWhat.as(async () => {
      return new Promise((resolve, reject) => {
        let timeoutId;
  
        const listener = async (...args) => {
          try {
            if (await predicate(...args, emitter)) {
              cleanup();
              resolve(await f(...args, emitter));
            }
          } catch (err) {
            cleanup();
            reject(err);
          }
        };
  
        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (typeof emitter.off === "function") {
            emitter.off(event, listener); // Node.js EventEmitter
          } else if (typeof emitter.removeEventListener === "function") {
            emitter.removeEventListener(event, listener); // DOM EventTarget
          }
        };
  
        if (typeof emitter.on === "function") {
          emitter.on(event, listener);
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(event, listener);
        } else {
          throw new Error("Unsupported emitter type");
        }
  
        if (timeoutMs > 0) {
          timeoutId = setTimeout(() => {
            cleanup();
            reject(new TimeoutError(`Event "${event}" timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        }
      });
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
 * Self-application: adapts this AsyncWhat for different use cases depending on the first argument.
 *
 * Overloads:
 *
 * 1. **Timeout mode** (1 number or more than 2 numbers):
 *    - `self(ms)` → runs this AsyncWhat with a timeout of `ms` milliseconds.
 *    - `self(ms, nAttempts, baseDelay, factor = 2)` → runs with timeout and retries `nAttempts` times,
 *      with exponential backoff. Throws an array of errors if all attempts fail.
 *
 * 2. **Argument-binding mode** (2 numbers):
 *    - `self(index, value)` → injects `value` into the argument list at position `index`.
 *
 * 3. **Context-mapping mode** (string):
 *    - `self(name)` → extracts `ctx[name]` as input to this AsyncWhat.
 *    - `self(nameIn, nameOut)` → maps `ctx[nameIn]` to input and stores result into `ctx[nameOut]`.
 *
 * 4. **Context-mapping mode** (string array):
 *    - `self([name1, name2, ...])` → extracts multiple properties from `ctx` as arguments.
 *    - `self([name1, name2, ...], nameOut)` → stores result into `ctx[nameOut]`.
 *
 * @param {number|string|string[]} [timeoutOrIndexOrNames]
 *        Timeout in ms, argument index, or property name(s) to extract from ctx.
 * @param {number|string} [nAttemptsOrValueOrName]
 *        Number of retry attempts (timeout mode), value to inject (argument-binding mode), or
 *        output property name (context-mapping mode).
 * @param {number} [baseDelay=100] Base delay in ms for retries (only in timeout + retry mode).
 * @param {number} [factor=2] Exponential backoff factor for retries (only in timeout + retry mode).
 * @returns {AsyncWhat} A new AsyncWhat instance wrapping the adapted behavior.
 */
self(...args) {
    return AsyncWhat.retype(AsyncWhat.self(this, ...args), this);
}

/**
 * Internal implementation of `self()`. Handles different overloads.
 *
 * @private
 * @param {Function} f AsyncWhat function to adapt
 * @param {...*} args Overload-dependent arguments
 * @returns {AsyncWhat} Wrapped AsyncWhat
 */
static self(f, ...args) {
    let got;

    if(args.length === 0) { 
        // Path-expanding mode
        got = async path => path.across(await AsyncEach.as(await f(path.last)).which().toArray());
        return AsyncWhat.as(got);
    } else if(typeof args[0] !== 'number') {
        // Context-mapping / nominal mode
        const [names, name] = args;
        return AsyncWhat.nominal(f, names, name);
    } else if(args.length === 1) {  
        // Timeout mode, single timeout
        const [timeoutMs] = args;
        got = async ctx => await AsyncWhat.within(timeoutMs, () => f(ctx), new TimeoutError('')); 
        return AsyncWhat.as(got);           
    } else if(args.length === 2) {
        // Argument-binding mode
        const [index, value] = args;
        return AsyncWhat.partial(f, index, value);
    } else {
        // Timeout + retry mode
        const [timeoutMs, nAttempts, baseDelay, factor] = args;
        if (factor === undefined) factor = 2;
        const attempt = AsyncWhat.self(f, timeoutMs);
        got = async ctx => AsyncWhat.retry(() => attempt(ctx), nAttempts, baseDelay, factor);
        return AsyncWhat.as(got);
    }

}

/**
 * Wraps a function to inject an argument at a specific index.
 *
 * @private
 * @param {Function} f
 * @param {number} index
 * @param {*} value
 * @returns {AsyncWhat}
 */
static partial(f, index, value) {
    const got = async (...args) => f(...args.slice(0, index), value, ...args.slice(index));
    return AsyncWhat.as(got);
}

/**
 * Wraps a function for nominal / context-mapping mode.
 *
 * @private
 * @param {Function|string} f Function to wrap, or key name in object
 * @param {string|string[]} names Property names to extract from context
 * @param {string} [name] Optional output property name to store result
 * @returns {AsyncWhat}
 */
static nominal(f, names, name) {
    let got;

    if (names === undefined) {
        // Wrap return in object { name: result }
        got = async (...args) => {
            const result = await f(...args);
            if (result === undefined) return undefined;
            const obj = {};
            obj[name] = result;
            return obj;
        };
    } else {
        // Extract properties from object
        got = async obj => {
            const args = await AsyncEach.as(typeof names === 'string' ? [names] : names)
            .sthen(key => typeof key === 'string' ? obj[key] : key)
            .toArray();

            const result = await (typeof f === 'string' ? obj[f] : f)(...args);            
            if (name !== undefined) {
                obj[name] = result;
                return obj;
            } 
            return result;
        };

    }

    return AsyncWhat.as(got);
}
/**
 * Runs an async function with a timeout.
 * 
 * If `fn()` does not resolve or reject within `timeoutMs` milliseconds, the returned
 * promise is rejected with the provided `error` (or a default TimeoutError).
 * 
 * This is useful to guard long-running async operations and ensures
 * the computation does not hang indefinitely.
 *
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {function(): Promise<any>} fn - Async function to execute
 * @param {Error} [error] - Error to reject with if timeout occurs
 * @returns {Promise<any>} Resolves with the result of `fn()` if completed in time
 * @throws {Error} Throws `error` if the timeout is reached before completion
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

/**
 * Retries a function multiple times with exponential backoff.
 * 
 * Each attempt is scheduled with an exponentially increasing delay:
 * `delay = baseDelay * 2 ** attemptIndex`.
 * 
 * **Important:** Each attempt starts independently after its scheduled delay,
 * so later attempts can start even if earlier attempts have not yet resolved.
 * This allows for parallelized “racing” retries, improving responsiveness.
 * 
 * The returned promise resolves with the first successful result.
 * If all attempts fail, it rejects with an array of all errors encountered.
 * 
 * @param {function(): Promise<any>} f - Function to retry
 * @param {number} ntimes - Number of attempts
 * @param {number} [baseDelay=100] - Base delay in ms for exponential backoff
 * @param {number} [factor=2] - Multiplicative factor for exponential growth
 * @returns {Promise<any>} Resolves with the first successful result
 * @throws {Array<Error>} Rejects with an array of all errors if all attempts fail
 */
static retry(f, ntimes, baseDelay = 100, factor = 2) {
    return new Promise((resolve, reject) => {
        let finished = false;
        const errors = [];

        for (let i = 0; i < ntimes; i++) {
            const delay = baseDelay * factor ** i; // exponential backoff

            setTimeout(async () => {
                if (finished) return;

                try {
                    const result = await f();
                    if (!finished) {
                        finished = true;
                        resolve(result);
                    }
                } catch (err) {
                    errors[i] = err;
                    if (errors.filter(Boolean).length === ntimes && !finished) {
                        finished = true;
                        reject(errors);
                    }
                }
            }, delay);
        }
    });
}

  
}

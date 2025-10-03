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
    // Construction
    // ----------------------

    /**
     * Create an `AsyncWhat` that matches specific argument values.
     *
     * @param {any|any[]} args Single value or list of values to match
     * @param {any} value Value to return if args match
     * @returns {AsyncWhat}
     */
    static of(...items) {
        const args = items.slice(0, -1);
        const value = items.at(-1);
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
        got.what = f.bind(got);
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
 * Returns an AsyncWhat that wraps the current AsyncWhat (`this`) and either starts
 * or stops it based on the given event and predicate.
 *
 * Behavior:
 * - `start = true`: the underlying AsyncWhat is only executed when the predicate
 *   evaluates truthy upon the occurrence of the event.
 * - `start = false`: the underlying AsyncWhat is immediately invoked (so it can
 *   run and be stopped) and will be stopped when the predicate evaluates truthy
 *   upon the event.
 *
 * Rejects with `TimeoutError` if no matching event occurs within the specified timeout.
 *
 * The returned AsyncWhat proxies the `.stopped` property of the underlying AsyncWhat.
 *
 * Example: infinite cyclic execution with start/stop triggers
 * 
 *   const cyclic = doSomething.self(Infinity, 100, 1);
 * 
 *   const bounded = cyclic
 *     .when(
 *       isStart,  
 *       emitter,
 *       event,
 *       undefined,
 *       true   // start cyclic execution when event occurs
 *     )
 *     .when(
 *       isStop,   
 *       emitter,
 *       event,
 *       undefined,
 *       false  // stop cyclic execution when event occurs
 *     );
 * 
 *   bounded();   
 *
 * @param {Function} predicate - Predicate `(…eventArgs, emitter) => boolean | Promise<boolean>`
 * @param {EventEmitter|EventTarget} emitter - Event source
 * @param {string} event - Event name to listen for
 * @param {number} [timeoutMs] - Timeout in milliseconds
 * @param {boolean} [start=true] - If `true`, executes underlying AsyncWhat when predicate matches; if `false`, immediately calls underlying AsyncWhat and stops it when predicate matches
 * @returns {AsyncWhat} A new asynchronous AsyncWhat that resolves with the result of the underlying function (if starting) or undefined (if stopping)
 * @throws {TimeoutError} If no matching event occurs within the timeout
 */
when(predicate, emitter, event, timeoutMs = undefined, start = true) {
    return AsyncWhat.when(predicate, this, emitter, event, timeoutMs, start);
}

/**
 * Static version of {@link when}.
 *
 * Waits for an event on an emitter. Each time the event fires,
 * evaluates `predicate(...eventArgs, emitter)`. If truthy:
 *   - removes the listener
 *   - sets `f.stopped = !start`
 *       - if `start = true`, allows the underlying AsyncWhat `f` to run
 *       - if `start = false`, stops `f` after it was immediately invoked
 *   - resolves with `f(...eventArgs, emitter)` only if starting; resolves immediately if stopping
 *
 * If `start = false`, the underlying AsyncWhat `f` is called immediately so it exists and can later be stopped.
 *
 * If no matching event occurs within `timeoutMs`, the listener is removed
 * and a `TimeoutError` is thrown.
 *
 * Works with both Node.js EventEmitter (`on`/`off`) and DOM EventTarget (`addEventListener`/`removeEventListener`).
 *
 * The returned AsyncWhat exposes a `.stopped` property, which proxies `f.stopped`.
 *
 * @param {Function} predicate - Predicate `(…eventArgs, emitter) => boolean | Promise<boolean>`
 * @param {Function|AsyncWhat} f - Handler `(…eventArgs, emitter) => any` or cyclic AsyncWhat
 * @param {EventEmitter|EventTarget} emitter - Source emitter
 * @param {string} event - Event name
 * @param {number} [timeoutMs] - Timeout in ms
 * @param {boolean} [start=true] - If `true`, executes `f` when predicate matches; if `false`, immediately calls `f` and stops it when predicate matches
 * @returns {AsyncWhat} Resolves to the result of `f` (if starting) or undefined (if stopping)
 * @throws {TimeoutError} if timeout is reached
 */
  static when(predicate, f, emitter, event, timeoutMs, start = true) {
    const got = AsyncWhat.as(async (...aa) => {
    
      if (!start) f(...aa);

      return new Promise((resolve, reject) => {
        let timeoutId;
  
        const listener = async (...args) => {
          try {
            if (await predicate(...args, emitter)) {
              cleanup();
  
              // Flip stopped flag according to start
              f.stopped = !start;
  
              if (start) {
                // Only run f when starting
                resolve(await f(...args, emitter));
              } else {
                // Stopping → resolve immediately
                resolve();
              }
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
  
    Object.defineProperty(got, "stopped", {
      get: () => f.stopped,
      set: v => (f.stopped = v)
    });
  
    return got;
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
 * Dynamically adapts this AsyncWhat instance for different use cases
 * depending on the arguments provided.
 * 
 * Overload modes:
 * 
 * 1. **Path-expanding mode** (no arguments):
 *    - `self()`  
 *      Converts this AsyncWhat: item -> items to an AsyncWhat: path -> paths by expanding path across the results of this(path.last).
 *
 * 2. **Context-mapping / nominal mode** (string or string[] as first arg):
 *    - `self(name)` → extracts `ctx[name]` and passes it as input.  
 *    - `self(nameIn, nameOut)` → maps `ctx[nameIn]` to input and stores result in `ctx[nameOut]`.  
 *    - `self([name1, name2, ...])` → extracts multiple properties from context.  
 *    - `self([name1, name2, ...], nameOut)` → stores result in `ctx[nameOut]`.
 *
 * 3. **Timeout mode** (single number):
 *    - `self(timeoutMs)`  
 *      Wraps this AsyncWhat so that it fails if it does not complete within `timeoutMs` ms.  
 *
 * 4. **Argument-binding mode** (two args: number, value):
 *    - `self(index, value)`  
 *      Injects `value` into the argument list at position `index`.  
 *
 * 5. **Retry mode** (numeric first arg with ≥3 args):
 *    - `self(nAttempts, baseDelay, factor, maxDelay)`  
 *      Retries this AsyncWhat with exponential backoff.  
 *      The produced AsyncWhat has a `.stopped` property which can be set to true to cancel retries.
 *
 * @param {number|string|string[]} [arg0] 
 *        - Numeric index, retry attempts, timeout in ms, or property name(s) to extract.
 * @param {number|string} [arg1] 
 *        - Value to inject (argument-binding), output property name (nominal mode), 
 *          or retry attempts (retry mode).
 * @param {number} [baseDelay=100] - Base delay in ms for retry mode
 * @param {number} [factor=1] - Exponential backoff factor for retry mode
 * @param {number} [maxDelay=Infinity] - Maximum delay for retry mode
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
        // timeout
        return AsyncWhat.within(args[0], f);
    } else if(args.length === 2) {
        // Argument-binding mode
        const [index, value] = args;
        return AsyncWhat.partial(f, index, value);
    } else {
        // Retry mode
        return AsyncWhat.retry(f, ...args);
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
 * Wraps `fn(ctx)` in a Promise.race against a timeout. 
 * Returns an AsyncWhat that resolves if `fn` completes before the timeout,
 * or rejects with the provided error (default TimeoutError).
 *
 * @param {number} timeoutMs - Timeout in ms
 * @param {function(any): Promise<any>} fn - Function to execute
 * @param {Error} [error] - Error to throw if timeout occurs
 * @returns {AsyncWhat} An AsyncWhat that enforces the timeout
 */
static within(timeoutMs, fn, error = new TimeoutError(`Operation timed out after ${timeoutMs}ms`)) {
    const got = async ctx => {
      let timer;
      try {
        return await Promise.race([
          fn(ctx),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(error), timeoutMs);
          })
        ]);
      } finally {
        clearTimeout(timer);
      }
    };
  
    return AsyncWhat.as(got);
  }
  
/**
 * Retries a function multiple times with exponential backoff, wrapped as an AsyncWhat.
 * 
 * The function `f(ctx)` may be synchronous or asynchronous. If it throws or rejects,
 * the next attempt is scheduled with an exponentially increasing delay:
 * `delay = min(baseDelay * factor ** attemptIndex, maxDelay)`.
 * 
 * Retries are scheduled via `setTimeout`, making this implementation **stack-safe**
 * even with infinite retries. Only the last error is stored, so it is memory-safe.
 * 
 * The returned AsyncWhat produces a Promise that has a `.stopped` property:
 * set it to `true` to cancel further retries. When stopped, the promise rejects
 * with the last encountered error (or a default "stopped by user" error).
 *
 * @param {function(*): any | Promise<any>} f - Function to retry, receives context
 * @param {number} [ntimes=Infinity] - Maximum number of attempts (`Infinity` for unlimited)
 * @param {number} [baseDelay=100] - Base delay in milliseconds
 * @param {number} [factor=1] - Exponential backoff factor
 * @param {number} [maxDelay=Infinity] - Maximum delay allowed between retries
 * @returns {AsyncWhat} An AsyncWhat that resolves with the first successful result,
 * or rejects with the last error.
 */
static retry(f, ntimes = Infinity, baseDelay = 100, factor = 1, maxDelay = Infinity) {
    
    let stopped = false;
    
    const got = ctx => {
        let attemptIndex = 0;
        let lastError = null;

        const p = new Promise((resolve, reject) => {

            const tryOnce = async () => {
                if (stopped) return reject(new Error("Retry stopped by user"));

                try {
                    const result = await f(ctx);
                    resolve(result);
                } catch (err) {
                    lastError = err;
                    attemptIndex++;
                    if (attemptIndex < ntimes && !stopped) {
                        const delay = Math.min(baseDelay * factor ** (attemptIndex - 1), maxDelay);
                        setTimeout(tryOnce, delay);
                    } else {
                        reject(stopped ? new Error("Retry stopped by user") : lastError);
                    }
                }
            };

            tryOnce(); // start first attempt
        });

        return p;
    };

    const stoppable =  AsyncWhat.as(got);

    // attach .stopped on the returned function
    Object.defineProperty(stoppable, "stopped", {
        get: () => stopped,
        set: v => { stopped = Boolean(v); }
    });

    return stoppable;
}



  
}

import { Each } from "./Each.js";
import {Path} from '../util/Path.js';

/**
 * The `What` class provides a functional abstraction layer for deferred, composable logic execution.
 * It supports unary and multivariate logic that can be chained, filtered, or mapped, and it integrates
 * seamlessly with the `Each` class for handling multivalued operations.
 *
 * Designed to model fluent functional programming, `What` allows dynamic composition of logic using
 * `if`, `then`, `else`, `match`, `when`, `each`, and more. It treats functions, constants, and
 * objects interchangeably, promoting a highly modular and declarative approach.
 *
 * Common Use Cases:
 * - Conditional logic (`if`, `when`, `else`)
 * - Mapping and filtering sequences (`each`, `which`)
 * - Structural transformations (`self`)
 * - Composing pipelines (`then`, `match`)
 *
 * @example
 * const what = What.as(x => x * 2).if(x => x > 0).then(x => x + 1);
 * what.what(5); // => 11
 */

export class What {

    /**
     * Abstract method to retrieve a value given arguments.
     * Must be implemented by subclasses or instances.
     * @abstract
     * @param {...*} args
     * @returns {*}
     */
    what(...args) {
        throw new Error('Abstract method what() must be implemented in subclasses!');
    }

    /**
     * Abstract method to define a value given argument or arguments.
     * Must be implemented by subclasses or instances.
     * @abstract
     * @param {* | Array<*>} arg 
     * @param {*} value
     */
    let(arg, value) {
        throw 'abstract method!'
    }

    /**
     * Wraps a function, value, or What instance into a What object.
     *
     * - If `f` is already a What instance, it is returned unchanged.
     * - If `f` is a function, a new What instance is created that delegates to `f`.
     * - If `f` is a value, it is treated as a constant predicate and converted into
     *   a function that checks for strict equality (`arg === f`).
     *
     * This method ensures a consistent interface for further functional composition.
     *
     * @param {*} f - A What instance, function, or constant value.
     * @returns {What} A What instance representing the given input.
     *
     * @example
     * What.as(x => x + 1).what(2); // => 3
     * What.as(5).what(5);          // => true
     * What.as(5).what(3);          // => false
     */
    static as(f) {
        if (f instanceof What) {
            return f;
        } else if (typeof f === 'function') {
            const got = new What();
            got.what = f;
            return got;
        } else {
            return What.as(arg => arg === f);
        }
    }

    /**
     * Converts this `What` instance into a standard JavaScript function.
     * This allows `What` logic to be used in any context expecting a plain function,
     * without losing the encapsulated logic of the `what` method.
     *
     * @example
     * const double = What.as(x => x * 2);
     * const fn = double.toFunc();
     * fn(4); // => 8
     *
     * @returns {Function} A function that applies the encapsulated `what(...args)` logic.
     */
    toFunc() {
        return (...args) => this.what(...args);
    }

    /**
     * Creates a `What` instance that returns a specific value
     * when called with arguments equal to the specified match arguments.
     *
     * This is useful for pattern-matching or constant lookup behaviors.
     *
     * @example
     * const one = What.of(1, 'one');
     * one.what(1); // => 'one'
     * one.what(2); // => undefined
     *
     * @param {* | Array<any>} matchArgs - Argument or arguments to match against.
     * @param {*} returnValue - Value to return if arguments match.
     * @returns {What} A What instance that acts like a constant function when matched.
     */
    static of(matchArgs, returnValue) {
        if (!Array.isArray(matchArgs)) matchArgs = [matchArgs];
        const got = new What();
        got.what = (...args) => Each.equal(args, matchArgs) ? returnValue : undefined;
        return got;
    }

    /**
     * Filters the argument of this `What` using a predicate.
     * Only returns results where the predicate returns `true`.
     *
     * @param {Function} [p=(item) => item !== undefined] - A predicate function.
     * @returns {What} A filtered `What` instance.
     */
    if(p = item => item !== undefined) {
        return What.if(this, p);
    }

    /**
     * Filters the multivalued results produced by this `What` using a predicate.
     * This is useful when the result of `what()` is iterable, and you want to retain only
     * the values that satisfy a certain condition.
     *
     * @param {Function} [p=(item) => item !== undefined] - A predicate function applied to each result item.
     * @returns {What} A new `What` instance that yields only values passing the predicate.
     *
     * @example
     * const source = What.as(() => [1, 2, 3, 4]);
     * const filtered = source.which(n => n % 2 === 0);
     * console.log([...filtered.what()]); // => [2, 4]
     */
    which(p = item => undefined !== item) {
        return What.which(this, p);
    }


    when(p, start = true, inclusive = start) {
        return What.when(this, p, start, inclusive);
    }

    then(f) {
        return What.then(this, f);
    }

    else(f) {
        return What.else(this, f);
    }

    match(...ff) {
        return What.match(this, ...ff);
    }

    each(f) {
        const got = new What();
        got.what = (...args) => {
            const
                got = new Each(),
                aa = Each.as(this.what(...args)).which().toArray();

            got[Symbol.iterator] = function* () {
                for (let a of aa) {
                    for (let b of Each.as(What.what(f, a)).which()) {
                        yield b;
                    }
                }
            }

            return got;
        }
        return got;
    }

    self(indexOrNames = undefined, valueOrName = undefined) {
        return What.self(this, indexOrNames, valueOrName);
    }

    /**
     * Applies a predicate to restrict the domain of the function.
     * @param {What|Function} f
     * @param {What|Function} p
     * @returns {What}
     */
    static if(f, p = item => undefined !== item) {
        return What.as(arg => What.what(p, arg) ? What.what(f, arg) : undefined);
    }

    /**
     * Filters the results of a multivalued function `f` using a predicate `p`.
     * 
     * The function `f` is expected to return an iterable (e.g., an `Each` instance),
     * and `p` is applied to each element of that iterable to determine if it should be included.
     * 
     * The predicate `p` receives three arguments:
     * - `value`: the current value in the iteration,
     * - `i`: the index of the current value,
     * - `arg`: the original argument passed to `f`.
     * 
     * This allows filtering based on content, position, or context.
     * 
     * @example
     * const source = What.as(x => [1, 2, 3, 4]);
     * const filtered = What.which(source, (v, i) => v % 2 === 0);
     * filtered.what('ignored'); // => [2, 4]
     * 
     * @param {What|Function} f - A multivalued function or What instance to filter.
     * @param {What|Function} [p=(item) => item !== undefined] - A predicate function.
     * @returns {What} A new What instance applying the filter to `f`'s result.
     */
    static which(f, p = item => undefined !== item) {
        return What.as(arg => {
            const q = (value, i) => p(value, i, arg);
            return Each.as(What.what(f, arg)).which(q);
        });
    }

    /**
     * Restricts the iteration returned by a multivalued function using a predicate or an index.
     *
     * If a number is passed as `predicateOrIndex`, it slices the iterable starting from (or until) that index
     * depending on `start` and `inclusive`.
     *
     * If a function or What is passed, it's treated as a predicate applied to each value.
     * The predicate can receive three arguments: `value`, `index`, and the original `arg`.
     *
     * Examples:
     *   - `when(f, 2)` skips the first two elements of the iterable returned by `f`.
     *   - `when(f, (value, i, arg) => value > 10)` keeps only values after the predicate matches.
     *
     * @param {What|Function} f - The source multivalued function.
     * @param {string|Function|number} predicateOrIndex - A numeric index or a predicate to slice the output.
     * @param {boolean} [start=true] - Whether to keep values starting from (or before) the match.
     * @param {boolean} [inclusive=start] - Whether the matched element is included in the result.
     * @returns {What} A new What instance with filtered iteration.
     */
    static when(f, predicateOrIndex, start = true, inclusive = start) {
        const isIndex = typeof (predicateOrIndex) === 'number';
        
        return What.as((...args) => {
            const resolvedPredicateOrIndex = isIndex? predicateOrIndex: (value, i) => What.what(predicateOrIndex, value, i, ...args);
            return Each.as(What.what(f, ...args)).when(resolvedPredicateOrIndex, start, inclusive);
        });
    }

    /**
     * Sequentially applies a series of functions.
     * @param {...(What|Function)} ff
     * @returns {What}
     */
    static then(...ff) {
        return What.as(arg => {
            let got = arg;
            for (let f of ff) {
                if (undefined === got) break;
                else if (got instanceof Promise) got = got.then(f);
                else got = What.what(f, got);
            }
            return got;
        });
    }

    /**
     * Applies fallback functions for undefined results.
     * @param {...(What|Function)} ff
     * @returns {What}
     */
    static else(...ff) {
        return What.as(arg => {
            let got;
            for (let f of ff) {
                try {
                    got = What.what(f, arg);
                } catch (error) {
                    got = undefined;
                }
                if (undefined !== got) break;
            }
            return got;
        });
    }

    /**
     * Applies a What, function, or constant to arguments.
     * @param {*} f
     * @param {...*} args
     * @returns {*}
     */
    static what(f, ...args) {
        return f instanceof What ? f.what(...args)
            : typeof (f) === 'function' ? f(...args)
                : f;
    }

    /**
     * Applies all functions in parallel and returns the result as an array.
     * @param {...Function|What} ff
     * @returns {What}
     */
    static match(...ff) {
        const got = ff.length < 2 ? arg => {
            const got = What.what(ff[0], arg);
            return got[Symbol.iterator] ? Each.as(got).then(value => [arg, value]) : [arg, got];
        } : arg => ff.map(f => What.what(f, arg));

        return What.as(got);
    }

    /**
     * Single step in the combinatorial multiplication of a sequence of multivalued functions.
     *
     * The search space of paths applying the function ff[path.length - 1] to the last element in the path argument
     * and extending the path with each result, generating a combinatorial expansion.
     * 
     * Undefined results are discarded.
     *
     * @param {...What|Function} ff - A sequence of multivalued functions.
     * @returns {What} A What instance returning an Each of Paths representing the combinatorial expansion across the functions.
     */
    static each(...ff) {
        return What.as(itemOrPath => {
            const path = itemOrPath instanceof Path? itemOrPath: Path.of(itemOrPath);
            return path.length > ff.length ? Each.of()
                : path.across(Each.as(What.what(ff[path.length - 1], path.last)).which()).which()
        });
    }

    /**
     * Transforms a `What` into a context-sensitive function with multiple use cases:
     * 
     * 1. **Path-based expansion**: When called with no arguments, the returned function treats
     *    the input as a `Path`. It applies `f` to the path's last element, then yields
     *    new paths extended with each result of the function.
     * 
     * 2. **Partial application**: If `names` is a number `i` and `name` is a fixed `value`,
     *    returns a function that injects `value` at position `i` in the argument list when calling `f`.
     * 
     * 3. **Object mapping**:
     *    - If `names` is a string or array of strings, values are extracted from those keys in an input object.
     *    - The function `f` is then applied to the extracted values.
     *    - If `f` is a string, it is treated as a **property name** that resolves to a function on the object.
     *    - If `name` is provided, the result is stored in the object under `name`; otherwise the result is returned.
     *
     * @param {Function|What|string} f - A function, What, or property name pointing to a function in the object mapping.
     * @param {number|string|string[]} indexOrNames - Index for partial application, or keys to extract from an object.
     * @param {* | string} valueOrName - In partial application, the value to insert; in object mapping, the output property name.
     * @returns {What} A new `What` instance implementing the specified behavior.
     */
    static self(f, indexOrNames = undefined, valueOrName = undefined) {
        let got;
        if (undefined === indexOrNames) {
            if (undefined === valueOrName)
                got = path => path.across(Each.as(What.what(f, path.last)).which());
            else {
                got = (...args) => {
                    const result = What.what(f, ...args);
                    if (undefined === result) return undefined;
                    const obj = {};
                    obj[valueOrName] = result;
                    return obj;
                };
            }
        } else {
            if (typeof(indexOrNames) === 'number') {
                got = (...args) => {
                    const aa = args.splice(i, 0, valueOrName);
                    return What.what(f, ...aa);
                }
            } else {
                got = obj => {
                    const args = Each.as(typeof (indexOrNames) === 'string' ? [indexOrNames] : indexOrNames).then(
                        next => typeof (next) === 'string' ? obj[next] : next
                    );
                    const result = What.what(typeof (f) === 'string' ? obj[f] : f, ...args);
    
                    if (undefined === result) return undefined;
                    else if (undefined !== valueOrName) {
                        obj[valueOrName] = result;
                        return obj;
                    } else {
                        return result;
                    }
                };
            }
        }

        return What.as(got);
    }
}

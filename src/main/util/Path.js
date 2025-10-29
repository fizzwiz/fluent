import { Each } from "../core/Each.js";

/**
 * A {@link Path} is an immutable linked list of items defined by three properties:
 * 
 * - [parent]{@link Path#parent}
 * - [last]{@link Path#last}
 * - [length]{@link Path#length}
 * 
 * It can be instantiated either from its properties or from a list of items:
 * 
 * - [of()]{@link Path.of}
 * 
 * Its methods:
 * 
 * - [add()]{@link Path#add}
 * - [along()]{@link Path#along}
 * - [across()]{@link Path#across}
 * 
 * create new {@link Path}s without modifying the source {@link Path}.
 * 
 * This allows the generation of new Paths without copying the parent path. This is the primary reason to use the {@link Path} 
 * class rather than a simple array of items.
 * 
 * Due to its structure, however, the {@link Path} can be iterated only backward. 
 * To iterate forward, the {@link Path} must first be converted into an array using:
 * 
 * - [toArray()]{@link Path#toArray}
 * 
 * Additional methods include:
 * 
 * - [isEmpty()]{@link Path#isEmpty}
 * - [isRoot()]{@link Path#isRoot}
 */
export class Path {

    /**
     * The parent {@link Path} of this path
     * @type {Path|undefined}
     */
    parent;

    /**
     * The latest item of this path
     * @type {*}
     */ 
    last;

    /**
     * The length of this {@link Path}
     * @type {number}
     */
    length;

    /**
     * Create a new {@link Path} from its properties
     * @param {Path} [parent=undefined] - The parent path
     * @param {*} [last=undefined] - The latest step
     */
    constructor(parent=undefined, last=undefined) {
        this.parent = parent;
        this.last = last;
        this.length = parent ? parent.length + 1 : last !== undefined ? 1 : 0;
    }

    /**
     * Create a new {@link Path} from a list of items
     * @param {...*} steps - The items to include in the path
     * @returns {Path} A new {@link Path} containing the given items
     */
    static of(...steps) {
        return new Path().along(steps);
    }

    /**
     * Check if this {@link Path} is empty
     * @returns {boolean} True if the path has no items
     */
    isEmpty() {
        return this.length === 0;
    }

    /**
     * Check if this {@link Path} has no parent (i.e., is a root path)
     * @returns {boolean} True if the path has no parent
     */
    isRoot() {
        return this.parent === undefined;
    }

    /**
     * Create a new {@link Path} by appending the given item to this {@link Path}
     * @param {*} item - The next step to add
     * @returns {Path} A new {@link Path} with the item appended
     */
    add(item) {
        return new Path(this.isEmpty() ? undefined : this, item);
    }

    /**
     * Create a new {@link Path} by appending all the given items to this {@link Path}
     * @param {Iterable<*>} items - Items to append
     * @returns {Path} A new {@link Path} including all appended items
     */
    along(items) {
        let got = this;
        for (let next of items) {
            got = got.add(next);
        }
        return got;
    }

    /**
     * Generate new {@link Path}s by appending each given step to this {@link Path}
     * @param {Iterable<*>} steps - Steps to extend the path
     * @returns {Iterable<Path>} An iterable producing a new {@link Path} for each step
     */ 
    across(steps) {
        const outer = this,
              got = new Each();
        
        got[Symbol.iterator] = function*() {
            for (let next of steps) {
                yield outer.add(next);
            }
        }
        return got;
    }

    /**
     * Convert the last `n` steps of this {@link Path} into an array
     * @param {number} [n=this.length] - Number of steps to include
     * @param {function} [f=step => step] - Function to transform each step
     * @returns {Array<*>} An array containing the last `n` steps (transformed)
     */ 
    toArray(n=this.length, f=step => step) {
        n = Math.min(n, this.length); // prevent exceeding length
        const got = new Array(n);
        let current = this;
        while (n > 0) {
            got[n - 1] = f(current.last);
            current = current.parent;
            n--;
        }
        return got;
    }

}

import { Each } from "../core/Each.js";
import { What } from "../core/What.js";
import { Scope } from "./Scope.js";

/**
 * A {@link Path} is an immutable aggregation of items implemented through the properties:
 * 
 * - [prev]{@link Path#prev}
 * - [last]{@link Path#last}
 * - [length]{@link Path#length}
 * 
 * It can be instatiated either from its properties or from its items:
 * 
 * - [of()]{@link Path.of}
 * 
 * Its methods:
 * 
 * - [add()]{@link Path#add}
 * - [across()]{@link Path#across}
 * 
 * create new {@link Path}s without modifying the source {@link Path}
 * 
 * Because of its structure, the {@link Path} can be iterated only backward, through its methods:
 * 
 * - [backwardIteration()]{@link Path#backPaths}
 * - [backtrace()]{@link Path#backSteps}
 * 
 * To iterate forward, the {@link Path} must before be converted into an array, through the method:
 * 
 * - [toArray()]{@link Path#toArray}
 * 
 * More offered methods are:
 * 
 * - [isEmpty()]{@link Path#isEmpty}
 */
export class Path extends Scope {
	
	/**
	 * Create a new {@link Path} from its properties
	 * @param {Path} [prev=undefined] previous path
	 * @param {*} [last=undefined] latest step
	 */
	constructor(prev=undefined, last=undefined) {
		super(prev, undefined);

		this._last = last;
		this._length = prev? prev._length + 1
			: undefined!==last? 1: 0
	}

	/**
	 * Create a new {@link Path} from its items
	 * @param {Iterable<*>} steps the items of the {@link Path}
	 * @returns {Path} the {@link Path} of the given items
	 */
	static of(...steps) {
		
		let got = new Path()
			.along(steps);
		
		return got
	}

	/**
	 * Builds the path of values specified by the given keys.
	 * The traversal stops at the first undefined key.
	 * 
	 * If a creator function is passed, undefined properties along the path are created.
	 * 
	 * @param {Object} obj - The root object
	 * @param {Array} keys - An array of keys representing the path
	 * @param {function} [creator=undefined] - A function with two arguments (obj, key) that creates the property if it's undefined
	 * @returns {Path} - The path of values
	 */
	static ofProperties(obj, keys, creator = undefined) {
		
		let path = new Path(), ctx = obj;

		for (let key of keys) {
			if (ctx[key] === undefined && creator) {
				// Call the creator function to instantiate the missing property
				ctx[key] = What.what(creator, ctx, key)
			}
			
			if (ctx[key] === undefined) { // The key is undefined and the missing property cannot be created
				break; // stop the path
			} else { // The key is defined, add it to the path and update the context
				path = path.add(ctx[key]);
				ctx = ctx[key];            
			}
		}

		return path; // Return the Path of values
	}
		
	/**
	 * The previous {@link Path}
	 */
	get prev() {
		return this._parent
	}
	
	/**
	 * Latest item
	 */
	get last() {
		return this._last
	}
	
	/**
	 * The length of this {@link Path}
	 */
	get length() {
		return this._length
	}
	
	/**
	 * Check if this {@Path} is empty
	 * @returns {Boolean}
	 */
	isEmpty() {
		return 0 == this._length 
	}
	
	/**
	 * Create a new {@link Path} by appending the given item to this {@link Path}
	 * 
	 * @param {*} item a further step
	 * @returns {Path} a new {@link Path}
	 */
	add(item) {
		return new Path(0 < this.length? this: undefined, item)
	}

	/**
	 * Create a new {@link Path} by appending all the given item to this {@link Path}
	 * 
	 * @param {*} items further steps
	 * @returns {Path} a new {@link Path}
	 */
	along(items) {
		
		let got = this;
		for(let next of items) {
			got = got.add(next);
		}
		
		return got
	}

	/**
	 * Create as many new {@link Path}s as the given items by appending each item to this {@link Path}
	 * 
	 * @param {*} items variety of steps which can prolong this path 
	 * @returns {Iterable<Path>} iteration dinamically generating each {@link Path}
	 */	
	across(steps) {
		
		const 
			outer = this,
			got = new Each();
			
			got[Symbol.iterator] = function*() {
				for(let next of steps) {
					yield outer.add(next)
				}
			}
		
		return got
	}


	/**
	 * Copy latest n steps of this {@link Path} into an array
	 * 
	 * @param {number} n number of steps to copy
	 * @param {function} [f=item=>item] function to apply to each step
	 * @returns {Array<*>} array of transformed steps
	 */	
	toArray(n=this.length, f=step=>step) {
		
		const got = new Array(n);   
		let current = this;
		
		while(0 < n) {
			got[n - 1] = f(current.last);
			current = current.prev;
			n--;
		}
		
		return got
	}

}

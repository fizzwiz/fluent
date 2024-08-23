import { What } from './What.js';
import { Path } from '../util/Path.js';

/**
 * The `Each` class implements an abstract, immutable, iteration of items by defining
 * an abstract iterator() method.<br>
 * 
 * Every method returning an instance of the class has to provide implementation for the iterator()
 * method of the returned instance.
 * 
 * @author Roberto Venditti
 * @see {@link What}
 * @class
*/
export class Each {

    /**
     * This method is abstract.
     * Every method returning an `Each` instance must provide a custom implementation for
     * this method.
     */
    [Symbol.iterator]() {
        throw 'abstract method!'
    }

    /**
     * Converts this `Each` to an array
     * @returns {any[]} an array 
     */
    toArray() {
        return Array.from(this)
    }

    /**
     * Converts an iteration of items to a `Each`   
     *  
     * @param {undefined | * | Iterable<*>} [items=undefined] - if undefined, the iteration is empty
     * @returns {Each} 
     */
    static as(items) {
        
        if(undefined === items) {
            return Each.of()
        } else if(items instanceof Each) {
            return items
        } else if(items[Symbol.iterator]) {
            const got = new Each();	

            got[Symbol.iterator] = items[Symbol.iterator].bind(items);            
            return got
        } else {
            return Each.of(items)
        }
    }

    /**
     * Creates a `Each` by explicitely enumerating all its items
     * @param  {...any} items 
     * @returns {Each} a `Each`
     */
    static of(...items) {
		return Each.as(items)
	}

    /**
     * Checks if `this` iteration is equivalent to `that` iteration
     * If some of the items is itself an iteration, the equivalence is tested recursively
     * 
     * @param {Iterable<any>} that 
     * @returns {boolean} true if and only if the length of the given iterations coincides 
     * and each corresponding couple of items is also equivalent
     */
    equals(that) {
        return Each.equal(this, that)
    }

    /**
     * Restricts `this` `Each` to the items verifying the given predicate `p`
     * @param {Function | What} p a Boolean `function(item, index)`
     * @returns {Each} the restricted `Each`
     */
    if(p=item => undefined != item) {
        return Each.if(this, p)
    }

    /**
     * Restricts `this` `Each` to the items verifying the given predicate `p`
     * In the context of the `Each` class, the `which` operation coincides with the `if` operation.
     * However, in the context of the twin class `What`, the two operations: `if` and `which` diverge
     * 
     * @param {Function | What} p a Boolean  `function(item, index)`
     * @returns {Each} the restricted `Each`
     */
    which(p=item => undefined != item) {
        return Each.which(this, p)
    }
        
    /**
     * Applies the given function, a What is also allowed, to each item
     * @param {Function | What} f a `function(item, index)`
     * @returns {Each} the corresponding items
     */
    then(f) {
        return Each.then(this, f)
    }

    /**
     * Appends the given `that` items to `this` items.
     * 
     * If no argument is provided, the method calls its static version by passing `this` {@link Each}
     * as an argument, which is expected to be an iteration of iterations.
     * 
     * @param {Iterable<*>} that whatever `Iterable` object
     * @returns {Each} concatenation of `this` and `that` iterations
     */
    else(that) {
        return Each.else(this, Each.as(that))
    }

    /**
     * Pairs `this` items with `that` items. 
     * 
     * If no argument is provided, the method calls its static version by passing `this` {@link Each}
     * as an argument, which is expected to be an iteration of iterations.
     * 
     * @param {Iterable<*>} that whatever `Iterable` object
     * @returns {Each} iteration of couples `[a, b]` where a, b are corresponding items from `this` and `that` iterations, respectively
     */
    match(that) {
        return Each.match(this, Each.as(that))
    }

    /**
     * Multiplies `this` items with `that` items.
     * 
     * If no argument is provided, the method calls its static version by passing `this` {@link Each}
     * as an argument, which is expected to be an iteration of iterations.
     *  
     * @param {Iterable<*>} that whatever `Iterable` object 
     * @returns {Each | What} all the couples `[a, b]` where a, b are items from `this` and `that` iterations, respectively
     */
    each(that) {
        const 
            aa = this,
            got = new Each();
            
        got[Symbol.iterator] = function*() {

            for(let a of aa) {
                for(let b of Each.as(that)) {
                    yield [a, b]
                }
            }
        }

        return got
    }

    /**
     * Starts/ends the iteration when the given predicate becomes true.
     * An index: 0, 1, ... is also allowed in place of the predicate.
     * 
     * @param {Function | Number} p predicate or index
     * @param {boolean} [start=true] if `true`, the iteration starts; otherwise it ends
     * @param {boolean} [inclusive=start] if `false`, the item starting/stopping the iteration is excluded from the returned iteration
     * @returns {Each} a slice of this iteration
     */
    when(p, start=true, inclusive=start) {
        return Each.when(this, p, start, inclusive)
    }

    /**
     * This `Each` repeated 
     * 
     * @returns {Each<Each>} a `Each` of `Each`
     */
    self() {
        return Each.self(this)
    }

    /**
     * Reduces this iteration to an item
     * If an `op` is not provided, it is returned the first item
     * If a `start` is not provided, it is used the first item of `this` iteration
     * 
     * @param {Function} [op=undefined] a binary function
     * @param {*} [start=undefined] the initial value for the cumulative calculus `op(a, b)`
     * @returns {*} an item
     */
    what(op=undefined, start=undefined) {
       return Each.what(this, op, start)
    }

}

/**
 * Checks if the given iterations are equivalent.
 * If some of the items is itself an iteration, the equivalence is tested recursively.
 * 
 * @param {Iterable<any>} aa items
 * @param {Iterable<any>} bb items
 * @returns {boolean} `true` if and only if the length of the given iterations coincides 
 * and corresponding items `a, b` are also equivalent
 */
Each.equal = function(aa, bb) {

    if((typeof(aa) !== 'string') && Each.isIterable(aa) 
            && (typeof(bb) !== 'string') && Each.isIterable(bb)) {
        
        const 
            ait = aa[Symbol.iterator](),
            bit = bb[Symbol.iterator]();

        while(true) {
            const 
                a = ait.next(),
                b = bit.next();
            
            if(a.done || b.done) {
                return a.done === b.done
            } else if(!Each.equal(a.value, b.value)) {
                return false
            }
        }
    } else {
        return aa === bb
    } 
}

Each.isIterable = function(obj) {
    return null !== obj && undefined !== obj && obj[Symbol.iterator]
}

/**
 * The infinite series of natural numbers 0, 1, ...
 */
Each.NATURAL = new Each();
Each.NATURAL[Symbol.iterator] = function*() {
    let i = 0;
    while(true) {
        yield i++
    }
}

Each.if = function(aa, p=item => undefined !== item) {
    return Each.which(aa, p)
}

Each.which = function(aa, p=item => undefined !== item) {
       
    const got = new Each();
    
    got[Symbol.iterator] = function*() {
        for(let a of aa) {
            if(What.what(p, a)) {
                yield(a)
            }
        }
    }

    return got
}

Each.self = function(aa) {
    
    const got = new Each();
    
    got[Symbol.iterator] = function*() {
        while(true) {
            yield aa     
        }           
    }

    return got
}

Each.then = function(aa, f) {
    
    const got = new Each();
    
    got[Symbol.iterator] = function*() {

        let i = 0;
        for(let a of aa) {
            yield What.what(f, a, i++)                
        }
    }

    return got
}

/**
 * Flattens the given number of levels.
 * If n=1, the result is the sequential composition of the given iterations.
 * @param {*} aaa 
 * @returns {Each} flattened iteration
 */
Each.else = function(...aaa) {
       
    const got = new Each();
    
    got[Symbol.iterator] = function*() {
        
        for(let aa of aaa) {
            if(aa[Symbol.iterator]) {                
                for(let a of Each.else(...aa)) {                    
                    yield a 
                }  
            } else {
                yield aa
            }                          
        }
    }

    return got
}

/**
 * Parallel composition of corresponding items from the given iterations
 * @param {*} aaa iteration of iterations
 * @returns {Each} iteration of arrays `[a, b, ...]`
 */
Each.match = function(...aaa) {
       
    const got = new Each();
    
    got[Symbol.iterator] = function*() {
        
        const 
            iit = aaa
                .map(aa => aa[Symbol.iterator]? aa: Each.of(aa))
                    .map(aa => aa[Symbol.iterator]());
        
        while(true) {
            
            const next = iit.map(it => it.next());            
            
            if(next.every(entry => entry.done)) {
                break
            } else {
                yield next.map(entry => entry.value)
            }            
        }
    }

    return got
}

/**
 * Multiplies items from the given iterations
 * @param {*} aaa iterations
 * @returns {What} search space of {@link Path}s 
 */
Each.each = function(...aaa) {

    aaa = aaa.map(aa => aa[Symbol.iterator]? aa
            : [aa]);
    
    const got = path => path.length < aaa.length? path.across(aaa[path.length])
            : Each.of();
            
    return What.as(got)
}

/**
 * Starts/ends the given iteration when the given predicate `p(item, index)` becomes `true`
 * @param {*} aa items
 * @param {Function | What} p a Boolean `function(item, index)`
 * @returns {Each} iteration
 */
Each.when = function(aa, p, start=true, inclusive=start) {
       
    if(typeof(p) === 'number') {
        const index = p;
        p = (_, i) => i === index
    }

    const 
        got = new Each(),
        toStart = function*() {

            let 
                i = 0,
                started = false;
    
            for(let a of aa) {
                
                if(started) {
                    yield a
                } else if(What.what(p, a, i)) {
                    started = true;
                    if(inclusive) {
                        yield a
                    }                    
                } 
                
                i++
            }         
        },

        toEnd = function*() {

            let 
                i = 0,
                ended = false;
    
            for(let a of aa) {
                
                if(ended) {
                    break
                } else if(What.what(p, a, i)) {
                    ended = true;
                    if(inclusive) {
                        yield a
                    }                
                } else {
                    yield a
                }
                
                i++
            }         
        };
    
    got[Symbol.iterator] = start? toStart
        : toEnd;

    return got
}

/**
 * Reduces the given iteration to an item
 * If an `op` is not provided, it is returned the first item
 * If a `start` is not provided, it is used the first item of the iteration
 * 
 * @param {Iterable<*>} aa any iteration
 * @param {Function} [op=undefined] a binary function
 * @param {*} [got=undefined] the initial value for the cumulative calculus `op(a, b)`
 * @returns {*} an item
 */
Each.what = function(aa, op, got) {
       
    if(op) {
        if(undefined === got) {
            got = Each.what(aa);
            aa = Each.when(aa, 1)
        }

        for(let next of aa) {
            got = What.what(op, got, next)            
        }

        return got
    } else {
        for(let next of aa) {
            return next
        }
    }
} 
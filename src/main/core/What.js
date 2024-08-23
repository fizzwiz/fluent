import { Each } from "./Each.js";
import { Path } from "../util/Path.js";

export class What {

    /**
     *  
     * @param {*} arg 
     * @returns {*}
     */
    what(...args) {
        throw 'abstract method!'
    }

    let(value, ...args) {
        throw 'abstract method!'
    }

    /**
     * Converts whatever function `f` to a `What`
     * @param {*} f 
     * @returns {What} a `What`
     */
    static as(f) {
        if(f instanceof What) {
            return f
        } else if( typeof(f) === 'function')  {
            const got = new What();
            got.what = f;
            return got    
        } else {    // any object f can be regarded as a predicate
            return What.as(arg => arg === f)
        }
    }

    /**
     * Converts this `What` to a function
     * @returns {Function} a `function`
     */
    toFunc() {
        return (...args) => this.what(...args)
    }

    static of(value, ...args) {
        const got = new What();
        got.what = (...aa) => Each.equal(aa, args)? value
                : undefined;
        return got;
    }

    if(p=item => undefined !== item) {
        return What.if(this, p)
    }

    which(p=item => undefined !== item) {
        return What.which(this, p)
    }

    when(p, start=true, inclusive=start) {
        return What.when(this, p, start, inclusive)
    }

    then(f) {
        return What.then(this, f)
    }

    else(f) {
        return What.else(this, f)
    }

    match(f) {
        return What.match(this, f)
    }

    each(f) {
        const got = new What();
        got.what = (...args) => {
            const 
                got = new Each(),
                aa = Each.as(this.what(...args)).which().toArray();
            
                got[Symbol.iterator] = function*() {
                for(let a of aa)  {
                    for(let b of Each.as(What.what(f, a)).which()) {
                        yield b;
                    }
                }                
            }

            return got;
        }
        return got
    }
    
    self(names=undefined, name=undefined) {
        return What.self(this, names, name)
    }
}

What.if = function(f, p=item => undefined !== item) {
    return What.as(arg => What.what(p, arg)? What.what(f, arg)
            : undefined)
}

What.which = function(f, p=item => undefined !== item) { 
    return What.as(arg => Each.as(What.what(f, arg)).which(p.bind(undefined, arg)))
}

/**
 * Se 
 * @param {string | function} exprOrFunc un nome oppure una espressione in cui la variabile ha nome 'ctx' oppure una funzione
 */
What.when = function(f, predicateOrIndex, start=true, inclusive=start) { 

    const isIndex = typeof(predicateOrIndex) == 'number';   
    return What.as(arg => Each.as(What.what(f, arg)).when(isIndex? predicateOrIndex: What.as(predicateOrIndex).toFunc().bind(undefined, arg), start, inclusive))
}

What.then = function(...ff) {
    return What.as(arg => {
        
        let got = arg;
        
        for(let f of ff) {
            got = What.what(f, got);
            if(undefined === got) {
                break
            }
        }

        return got
    })
}

What.else = function(...ff) {
    
    return What.as(arg => {
 
        let got;
        
        for(let f of ff) {
            got = What.what(f, arg);
            if(undefined !== got) {
                break
            }
        }

        return got
    })
}

/**
 * 
 * @param {What | Function | *} f può essere tanto un What quanto una funzione quanto una costante
 * @param  {...any} args 
 * @returns {*} 
 */
What.what = function(f, ...args) {
    return f instanceof What? f.what(...args)
        : typeof(f) === 'function'? f(...args)
            : f
}

What.match = function(...ff) { 
    const got = arg => ff.map(f => What.what(f, arg));
    return What.as(got)
}

/**
 * 
 */
What.each = function(...ff) {
    return What.as(path => path.length > ff.length? Each.of()
            : path.across(Each.as(What.what(ff[path.length - 1], path.last))).which())
}

What.self = function(f, names=undefined, name=undefined) { 
    
    let got = path => path.across(Each.as(What.what(f, path.last)).which());

    if(undefined !== names) {
        got = obj => {
            const 
                args = Each.as(typeof(names) === 'string'? [names]: names).then(next => typeof(next) === 'string'? obj[next]: next),
                got = What.what(typeof(f) === 'string'? obj[f]: f, ...args);

            if(undefined === got) {
                return undefined
            } else if(undefined !== name) {
                obj[name] = got;
                return obj
            } else {
                return got
            }
        }
    } else if(undefined !== name) {
        
        got = (...args) => {
            let got = What.what(f, ...args);
            if(undefined === got) {
                return undefined
            } else {
                const obj = {};
                obj[name] = got;
                return obj
            }
        }
    }

    return What.as(got)
}    
    




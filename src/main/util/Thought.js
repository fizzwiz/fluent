import { What } from "../core/What.js";
import { Matcher } from "../what/Matcher.js";
import { Scope } from "./Scope.js";

export class Thought extends Scope {

    constructor(parent=undefined, name=undefined) {
        super(parent, name)
    }

    letElse(name, ...steps) {
        return this.let(name, [Thought.DISJUNCTIVE, ...steps])
    }

    letThen(name, ...steps) {
        return this.let(name, [Thought.CONJUNCTIVE, ...steps])
    }
    
    letEach(name, ...steps) {
        return this.let(name, [Thought.MULTIPLICATIVE, ...steps])
    }

    about(name) {
        if(this[name]) {
            
            const got = (...args) => {
                let[type, ...ff] = this[name];
                ff = ff.map(f => this.func(f));
                const 
                    w = 
                        type === Thought.DISJUNCTIVE? What.else(...ff):
                        type === Thought.CONJUNCTIVE? What.then(...ff):
                        type === Thought.MULTIPLICATIVE? ff.reduce((f, g) => What.as(f).each(g))
                        : undefined,
                    got = w.what(...args);
                
                return got
            }

            return What.as(got)
            
        } else if(this.parent) {
            return this.parent.about(name)
        } else {
            return undefined
        }
    }

    func(step) {
        if(typeof(step) === 'string') {
            return this.about(step)
        } else if(step instanceof RegExp) {
            return new Matcher(step)
        } else if(Array.isArray(step)) {
            const [f, names, name] = step;
            return What.as(this.func(f)).self(names, name)
        } else {
            return step
        }
    }
}

Thought.DISJUNCTIVE = 0;
Thought.CONJUNCTIVE = 1;
Thought.MULTIPLICATIVE = 2;
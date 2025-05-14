import { Each } from "../core/Each.js";
import { What } from "../core/What.js";

/**
 * Funzione che, dato un testo, produce il match di una regular expression con il testo dato
 * 
 */
export class Matcher extends What {
    
    /**
     * 
     * @param {string | Regexp | Matcher} regex una regular expression 
     * @param {Boolean} [singleton=true]
     */
    constructor(regex, singleton=true) {        
        super(); 
        this._regex = typeof(regex) === 'string'? new RegExp(regex)
                : regex instanceof RegExp? regex
                    : regex.regex;
        this._singleton = singleton;
    }

    get regex() {
        return this._regex
    }
 
    get singleton() {
        return this._singleton
    }

    /**
     * 
     * @param {string|Array} txt un testo oppure un match precedente (Array)
     * @returns {Array<string> | Each<Array<string>>} un singolo match oppure tutti i possibili match
     */
    what(txt) {
        
        if(typeof(txt) !== 'string') {
            txt = txt.input.substring(txt.index + txt[0].length)
        }

        const
            regex = this.singleton? this.regex: new RegExp(this.regex.source, 'g'),
            got = new Each();

        got[Symbol.iterator] = function*() {
            let match = regex.exec(txt);
            while(match) {
                yield match;
                match = regex.exec(txt)
            } 
        }

        return this.singleton? got.what()
                : got
    }

    and(that) {
        const pattern = Matcher.and(this.regex.source, Matcher.pattern(that));
        return new Matcher(new RegExp(pattern, this.regex.flags), this.singleton)
    }

    static and(...exprs) {
        const got = exprs.join('');
        return got
    }

    or(that) {
        const pattern = Matcher.or(this.regex.source, Matcher.pattern(that));
        return new Matcher(new RegExp(pattern, this.regex.flags), this.singleton)
    }

    static or(...exprs) {
        return exprs.join('|')
    }

    get(boolOrName=undefined) {
        const pattern = Matcher.get(this.regex.source, boolOrName);
        return new Matcher(new RegExp(pattern, this.regex.flags), this.singleton)
    }

    static get(expr, boolOrName=undefined) {
        let got = 
            (undefined === boolOrName)? `(${expr})`
                : (false === boolOrName)? `(?:${expr})`
                    : `(?<${boolOrName}>${expr})`;
        return got
    }

    static got(indexOrName) {
        let got = 
            typeof(indexOrName) === 'number'? `\\${indexOrName}`
                : `\\k<${indexOrName}>`
        return new Matcher(new RegExp(got), this.singleton)
    }

    many(one=true, sep=undefined) {
        if(undefined === sep) {
            return this.and(one? '+': '*')
        } else {
            sep = new Matcher(new RegExp(Matcher.pattern(sep)), this.singleton);
            return ( one? this: this.n(0, 1)).and(sep.and(this).get(false).many(false))
        }
    }

    n(min, max=undefined) {
        const pattern = Matcher.n(this.regex.source, min, max);
        return new Matcher(new RegExp(pattern), this.singleton)
    }

    static n(expr, min, max=undefined) {
        const 
            qmin = min==undefined? '': min,
            qmax = max==undefined? '': max,
            quantifier = `{${qmin},${qmax}}`;
        return expr + quantifier;
    }

    lazy() {
        return this.and('?')
    }

    asFirst(countingSpaces=false) {
        const pattern = Matcher.and('^', countingSpaces? '': '\\s*', this.regex.source);
        return new Matcher(new RegExp(pattern), this.singleton)
    }

    asLast(countingSpaces=false) {
        const tail = (countingSpaces? '': '\\s*') + '$';
        return this.and(tail);
    }

    is(bool=true) {
        const pattern = Matcher.is(this.regex.source, bool);
        return new Matcher(new RegExp(pattern), this.singleton)
    }

    static is(expr, bool=true) {
        return bool? `(?=${expr})`
                : `(?!${expr})`
    }

    was(bool=true) {
        const pattern = Matcher.was(this.regex.source, bool);
        return new Matcher(new RegExp(pattern), this.singleton)
    }

    static was(expr, bool=true) {
        return bool? `(?<=${expr})`
                : `(?<!${expr})`
    }

    static pattern(stringOrRegexOrMatcher) {
        const got = 
            stringOrRegexOrMatcher instanceof Matcher? stringOrRegexOrMatcher.regex.source:
            stringOrRegexOrMatcher instanceof RegExp? stringOrRegexOrMatcher.source:
            stringOrRegexOrMatcher;
        return got
    }

}

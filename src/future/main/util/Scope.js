import { Each } from "../../../main/core/Each.js";
import { What } from "../../../main/core/What.js";

/**
 * The Scope is a tree node.
 * The properties 'parent', 'name' provide the tree structure.
 * Any object can be stored as a property of this Scope by let(name, obj, asChild=false)
 * If obj is a Scope itself and asChild=true, its parent and name properties are also set.
 * 
 * While this[name] retrieves back the property, the method get(name) searchs for the property non-only 
 * in this Scope but also upwards along the ancestors of this Scope
 * 
 * The method children() iterates all the child Scopes
 */
export class Scope {

    constructor(parent=undefined, name=undefined, children={}) {
        this._parent = parent
        this._name = name
        this._children = children
    }

    get parent() {
        return this._parent
    }

    set parent(scope) {
        this._parent = scope
    }

    get name() {
        return this._name
    }

    let(name, value) {
        this[name] = value
        return this
    }

    letChild(name, child) {
        this.children[name] = child
        child.parent = this
        child.name = name
        return this
    }

    get(...names) {  
       
        return this.ancestors()
            .which(a => undefined !== a[name])
                .then(a => a[name])
                    .what();
    }

    getChild(...names) {
        let 
            got = this,
            i = 0;

        while(got && i < names.length) {
            got = got.children[names[i]]
            i++
        }

        return got
    }

    resolve(nameOrObj) {
        return typeof(nameOrObj) === 'string'? this.get(nameOrObj): nameOrObj
    }

    forget(name) {
        delete this[name];
        return this
    }

    isLeaf() {
        return undefined === this.children().what()
    }

    isRoot() {
        return undefined === this.parent
    }

    children() {
        return Each.as(Object.values(this.children))
    }

    root() {
        return this.parent? this.parent.root()
            : this
    }
   
	ancestors() {
        return Each.along(this, item => item.parent)
	}

}
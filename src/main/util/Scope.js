import { Each } from "../core/Each.js";

/**
 * The Scope is a tree node.
 * The properties 'parent', 'name' provides the tree structure.
 * Any object can be stored as a property of this Scope by let(name, obj, asChild=false)
 * If obj is a Scope itself and asChild=true, its parent and name properties are also set.
 * 
 * While this[name] retrieves back the property, the method get(name) searchs for the property non-only 
 * in this Scope but also upwards along the ancestors of this Scope
 * 
 * The method children() iterates all the child Scopes
 */
export class Scope {

    constructor(parent=undefined, name=undefined) {
        this._parent = parent;
        this._name = name;
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

    let(name, value, asChild=false) {

        this[name] = value;
        if(asChild && value instanceof Scope) {
            value.parent = this;
            value.name = name
        }

        return this
    }

    isLeaf() {
        return undefined === this.children().what()
    }

    isRoot() {
        return undefined === this.parent
    }

    children() {
        return Each.as(Object.values()).which(obj => obj instanceof Scope && obj.parent === this)
    }

    root() {
        return this.parent? this.parent.root()
            : this
    }
   
	ancestors() {
		let 
			got = {},
			current = this;

		got[Symbol.iterator] = function*() {
			while(current) {
				yield current;
				current = current.parent
			}
		}

		return got
	}

    get(name) {
        return this.ancestors()
            .which(a => undefined !== a[name])
                .then(a => a[name])
                    .what();
    }

    resolve(nameOrObj) {
        return typeof(nameOrObj) === 'string'? this.get(nameOrObj)
            : nameOrObj
    }

}
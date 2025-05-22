import { Each } from "../core/Each.js";
import { What } from "../core/What.js";

/**
 * Scope represents a tree node structure that supports hierarchical storage and lookup of named properties and child Scopes.
 * 
 * Each Scope instance has an optional parent, a name, and a collection of named child Scopes. It can store arbitrary properties
 * and resolve them through an upward search via the get() method. The children() method yields all child Scopes.
 */
export class Scope {
    
    /**
     * Constructs a new Scope instance representing a node in a tree structure.
     *
     * @param {Scope|undefined} parent - (Optional) The parent Scope, establishing upward linkage in the tree.
     * @param {string|undefined} name - (Optional) The name assigned to this Scope, typically within its parent's children map.
     * @param {Object.<string, Scope>} children - (Optional) A dictionary of named child Scopes.
     *
     * Each Scope can hold arbitrary properties and may reference children and a parent,
     * enabling hierarchical navigation and scoped resolution of values.
     *
     * @example
     * const root = new Scope();
     * const child = new Scope();
     * root.letChild('child1', child);
     */
    constructor(parent = undefined, name = undefined, children = {}) {
        this._parent = parent;
        this._name = name;
        this._children = children;
    }

    /**
     * Gets the parent Scope.
     */
    get parent() {
        return this._parent;
    }

    /**
     * Sets the parent Scope.
     */
    set parent(scope) {
        this._parent = scope;
    }

    /**
     * Gets the name of this Scope.
     */
    get name() {
        return this._name;
    }

    /**
     * Stores a named property in this Scope.
     * @param {string} name - Property name
     * @param {*} value - Value to store
     * @returns {Scope} - The Scope itself (for chaining)
     */
    let(name, value) {
        this[name] = value;
        return this;
    }

    /**
     * Adds a child Scope under this Scope.
     * @param {string} name - Name of the child
     * @param {Scope} child - The child Scope
     * @returns {Scope} - The Scope itself (for chaining)
     */
    letChild(name, child) {
        this._children[name] = child;
        child.parent = this;
        child._name = name;
        return this;
    }

    /**
     * Retrieves a property by name by searching up through ancestors.
     * @param {...string} names - Property name(s)
     * @returns {*} - The first matching property value found
     */
    get(...names) {
        return this.ancestors()
            .which(a => names.every(name => a[name] !== undefined))
            .then(a => a[names[0]])
            .what();
    }

    /**
     * Retrieves a nested child Scope by following the given path of names.
     * @param {...string} names - Path of child names
     * @returns {Scope|undefined} - The resolved child Scope or undefined
     */
    getChild(...names) {
        let got = this;
        for (const name of names) {
            got = got?._children?.[name];
            if (!got) break;
        }
        return got;
    }

    /**
     * Resolves a value or a named reference in the scope.
     * @param {string|*} nameOrObj - Name or value
     * @returns {*} - Resolved value
     */
    resolve(nameOrObj) {
        return typeof nameOrObj === 'string' ? this.get(nameOrObj) : nameOrObj;
    }

    /**
     * Removes a property from the Scope.
     * @param {string} name - Property name
     * @returns {Scope} - The Scope itself (for chaining)
     */
    forget(name) {
        delete this[name];
        return this;
    }

    /**
     * Checks if the Scope has no children.
     * @returns {boolean}
     */
    isLeaf() {
        return this.children().what() === undefined;
    }

    /**
     * Checks if this Scope is the root (has no parent).
     * @returns {boolean}
     */
    isRoot() {
        return this.parent === undefined;
    }

    /**
     * Returns an Each instance over this Scope's children.
     * @returns {Each}
     */
    children() {
        return Each.as(Object.values(this._children));
    }

    /**
     * Recursively finds the root Scope.
     * @returns {Scope}
     */
    root() {
        return this.parent ? this.parent.root() : this;
    }

    /**
     * Returns an Each instance that iterates over this Scope and its ancestors.
     * @returns {Each}
     */
    ancestors() {
        return Each.along(this, item => item.parent);
    }

}

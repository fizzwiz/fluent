import { What } from "../core/What.js";

/**
 * The LiveSpace is a search space where nodes have a lifecycle during which they can evolve.
 * Nodes are retained in memory and grouped into equivalence classes based on a representation
 * function provided by subclasses. When two equivalent nodes are generated from different adjacents,
 * they merge into a single node. Once a node generates its adjacents, it is removed from memory.
 */
export class LiveSpace {
    /**
     * Initializes the LiveSpace with a population map.
     * @param {Map<string|number|boolean, *>} population A map where the key is a primitive
     * representing the equivalence class of a node, and the value is the node itself.
     */
    constructor(population = new Map()) {
        this._population = population;
    }

    /**
     * @returns {Map<string|number|boolean, *>} The population map of the LiveSpace.
     */
    get population() {
        return this._population;
    }

    /**
     * Defines the equivalence class of a node.
     * This method must be implemented in a subclass to specify the representation
     * that identifies equivalence classes.
     * @abstract
     * @param {*} node 
     * @returns {string|number|boolean} A primitive identifying the equivalence class of the node.
     */
    repr(node) {
        throw new Error("The `repr` method must be implemented in a subclass.");
    }

    /**
     * Generates adjacent nodes to the argument node.
     * This method must be implemented in a subclass.
     * @abstract
     * @param {*} node 
     * @returns {*[]} An array of adjacent nodes.
     */
    conceive(node) {
        throw new Error("The `conceive` method must be implemented in a subclass.");
    }

    /**
     * Merges two nodes with equivalent representations into a single node.
     * This method must be implemented in a subclass.
     * @abstract
     * @param {*} prev 
     * @param {*} next 
     * @returns {*} The resulting merged node.
     */
    mate(prev, next) {
        throw new Error("The `mate` method must be implemented in a subclass.");
    }

    /**
     * Expands the argument node by generating its adjacents, stores them in the population,
     * and removes the node. For each generated adjacent that has an equivalent in the population,
     * it merges the two nodes using the `mate` method.
     * @param {*} node 
     * @returns {*[]} The generated adjacent nodes.
     */
    what(node) {
        const adjacents = this.conceive(node);

        // Remove the current node from the population
        const nodeKey = this.repr(node);
        this._population.delete(nodeKey);

        for (const adjacent of adjacents) {
            const adjacentKey = this.repr(adjacent);

            if (this._population.has(adjacentKey)) {
                const existing = this._population.get(adjacentKey);

                // Merge existing node with the new adjacent node
                const merged = this.mate(existing, adjacent);
                if (merged !== existing) {
                    this._population.set(adjacentKey, merged);
                }
            } else {
                this._population.set(adjacentKey, adjacent);
            }
        }

        return adjacents;
    }
}

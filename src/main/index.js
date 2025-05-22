// Core modules
import { Each } from './core/Each.js';
import { What } from './core/What.js';

// Utility modules
import { Scope } from './util/Scope.js';
import { Path } from './util/Path.js';

// Re-export for direct imports from the root module
export { Each } from './core/Each.js';
export { What } from './core/What.js';
export { Scope } from './util/Scope.js';
export { Path } from './util/Path.js';

/**
 * The `core` module defines two fundamental classes for declarative, fluent programming:
 *
 * - {@link Each}: Represents a chainable, symbolic structure for defining and refining iterations. These iterations are formally constructed but not executed until needed.
 *
 * - {@link What}: Represents a fluent interface for composing and transforming functions. 
 *
 * Both classes support intuitive method chaining for composing logic, filtering results, and transforming behavior in a readable way.
 *
 * @module core
 * @exports core
 */
export const core = {
    Each,
    What,
};

/**
 * The `util` module provides supporting structures that enhance expressiveness and traceability:
 *
 * - {@link Scope}: A hierarchical context used to represent nested logical frames or environments.
 * - {@link Path}: A symbolic record of decisions or transformations applied in sequence.
 *
 * These utilities assist with organizing, tracking, and reasoning about compositional flows.
 *
 * @module util
 * @exports util
 */
export const util = {
    Scope,
    Path,
};

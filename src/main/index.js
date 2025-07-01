/**
 * The `core` module defines two fundamental classes for declarative, fluent programming:
 *
 * - {@link Each}: Represents a chainable, symbolic structure for defining and refining iterations.
 * - {@link What}: Represents a fluent interface for composing and transforming functions. 
 *
 * @module core
 */
export { Each } from './core/Each.js';
export { What } from './core/What.js';

/**
 * The `util` module provides supporting structures that enhance expressiveness and traceability:
 *
 * - {@link Scope}: A hierarchical context used to represent nested logical frames or environments.
 * - {@link Path}: A symbolic record of decisions or transformations applied in sequence.
 *
 * @module util
 */
export { Scope } from './util/Scope.js';
export { Path } from './util/Path.js';
